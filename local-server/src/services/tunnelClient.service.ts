import axios from 'axios'
import WebSocket from 'ws'
import { OllamaService } from './ollama.service'

export class TunnelClient {
  private cloudUrl: string
  private giverName: string
  private giverId?: string
  private ws?: WebSocket
  private ollamaService: OllamaService
  private reconnectInterval?: NodeJS.Timeout

  constructor(
    cloudUrl: string,
    giverName: string,
    ollamaService: OllamaService,
  ) {
    this.cloudUrl = cloudUrl
    this.giverName = giverName
    this.ollamaService = ollamaService
  }

  async register(): Promise<void> {
    try {
      const isHealthy = await this.ollamaService.checkHealth()
      if (!isHealthy) {
        throw new Error('Ollama is not running or not accessible')
      }

      const models = await this.ollamaService.listModels()
      const modelNames = models.map((m) => m.name)

      if (modelNames.length === 0) {
        throw new Error(
          'No models found in Ollama. Please download models first.',
        )
      }

      const response = await axios.post(
        `${this.cloudUrl}/api/giver/register`,
        {
          name: this.giverName,
          models: modelNames,
        },
        {
          headers: {
            'X-CLI-Token': 'local-verification',
          },
        },
      )

      if (response.data.success && response.data.data) {
        this.giverId = response.data.data.giverId
        console.log(`✅ Registered as giver: ${this.giverId}`)
      } else {
        throw new Error(response.data.error || 'Registration failed')
      }
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to register: ${error.response.data?.error || error.message}`,
        )
      }
      throw new Error(`Failed to register: ${error.message}`)
    }
  }

  async connect(): Promise<void> {
    if (!this.giverId) {
      throw new Error('Not registered. Call register() first.')
    }

    const wsUrl = new URL(
      this.cloudUrl.replace('http://', 'ws://').replace('https://', 'wss://'),
    )
    wsUrl.pathname = '/ws'
    wsUrl.searchParams.set('role', 'giver')
    wsUrl.searchParams.set('giverId', this.giverId)

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl.toString())

      this.ws.on('open', () => {
        console.log('✅ WebSocket connected')
        this.updateStatus('online').catch((err) => {
          console.warn('Failed to update status:', err.message)
        })
        this.scheduleHeartbeat()
        resolve()
      })

      this.ws.on('message', async (data: Buffer) => {
        try {
          await this.handleMessage(data)
        } catch (error: any) {
          console.error('Error handling message:', error.message)
          this.sendError(error.message)
        }
      })

      this.ws.on('close', () => {
        console.log('⚠️  WebSocket closed. Attempting to reconnect...')
        this.updateStatus('offline').catch(() => {})
        this.scheduleReconnect()
        reject(new Error('Connection closed'))
      })

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error)
        reject(error)
      })
    })
  }

  private async updateStatus(status: 'online' | 'offline'): Promise<void> {
    if (!this.giverId) return

    try {
      const models = await this.ollamaService.listModels()
      const modelNames = models.map((m) => m.name)

      await axios.post(`${this.cloudUrl}/api/giver/${this.giverId}/status`, {
        status,
        models: modelNames,
      })
    } catch (error: any) {
      console.warn(`Failed to update status: ${error.message}`)
    }
  }

  private async handleMessage(data: Buffer): Promise<void> {
    const message = JSON.parse(data.toString())

    switch (message.type) {
      case 'inference_request':
        await this.handleInferenceRequest(message)
        break
      case 'ping':
        this.send({ type: 'pong' })
        break
      default:
        console.warn('Unknown message type:', message.type)
    }
  }

  private async handleInferenceRequest(message: any): Promise<void> {
    const { requestId, model, prompt, options } = message

    try {
      console.log(
        `📥 Received inference request: ${requestId} for model: ${model}`,
      )

      const stream = await this.ollamaService.generate({
        model,
        prompt,
        stream: true,
        options,
      })

      let fullResponse = ''
      let buffer = ''

      stream.on('data', (chunk: Buffer) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line)
              if (data.response) {
                fullResponse += data.response
                this.send({
                  type: 'inference_chunk',
                  requestId,
                  chunk: data.response,
                  done: data.done || false,
                })
              }
            } catch (e) {}
          }
        }
      })

      stream.on('end', () => {
        this.send({
          type: 'inference_complete',
          requestId,
          response: fullResponse,
        })
        console.log(`✅ Completed inference request: ${requestId}`)
      })

      stream.on('error', (error: any) => {
        this.sendError(error.message, requestId)
      })
    } catch (error: any) {
      this.sendError(error.message, requestId)
    }
  }

  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  private sendError(message: string, requestId?: string): void {
    this.send({
      type: 'inference_error',
      requestId,
      error: message,
    })
  }

  private scheduleHeartbeat(): void {
    setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' })
      }
    }, 30000)
  }

  private scheduleReconnect(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
    }

    this.reconnectInterval = setTimeout(() => {
      console.log('🔄 Attempting to reconnect...')
      this.connect().catch(() => {})
    }, 5000)
  }

  disconnect(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
    }
    if (this.ws) {
      this.ws.close()
    }
  }

  getGiverId(): string | undefined {
    return this.giverId
  }
}

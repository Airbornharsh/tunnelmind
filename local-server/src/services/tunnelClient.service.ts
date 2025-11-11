import WebSocket from 'ws'
import { OllamaService } from './ollama.service'
import Session from '../utils/session'

export class TunnelClient {
  private cloudUrl: string
  private giverName: string
  private ws?: WebSocket
  private ollamaService: OllamaService
  private reconnectInterval?: NodeJS.Timeout
  private sessionToken?: string

  constructor(
    cloudUrl: string,
    giverName: string,
    ollamaService: OllamaService,
  ) {
    this.cloudUrl = cloudUrl
    this.giverName = giverName
    this.ollamaService = ollamaService
  }

  async connect(): Promise<void> {
    const sessionToken =
      this.sessionToken || (await Session.getSessionToken()) || null

    if (!sessionToken) {
      throw new Error(
        'Session token not found. Please login using `tunnelmind login`.',
      )
    }

    this.sessionToken = sessionToken

    const models = await this.ollamaService.listModels()
    const modelNames = models.map((m) => m.name)

    if (modelNames.length === 0) {
      throw new Error(
        'No models available locally. Please pull a model with `ollama pull <model-name>`.',
      )
    }

    const wsUrl = new URL(
      this.cloudUrl.replace('http://', 'ws://').replace('https://', 'wss://'),
    )
    wsUrl.pathname = '/ws'
    wsUrl.searchParams.set('role', 'giver')
    wsUrl.searchParams.set('token', sessionToken)
    wsUrl.searchParams.set('giverName', this.giverName)
    if (modelNames.length > 0) {
      wsUrl.searchParams.set('models', modelNames.join(','))
    }

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl.toString())

      this.ws.on('open', () => {
        console.log('✅ WebSocket connected')
        this.send({
          type: 'giver_ready',
          giverName: this.giverName,
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
        this.scheduleReconnect()
        reject(new Error('Connection closed'))
      })

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error)
        reject(error)
      })
    })
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
      case 'pong':
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
}

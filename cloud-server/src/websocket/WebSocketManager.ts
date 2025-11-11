import { WebSocket, WebSocketServer } from 'ws'
import { IncomingMessage } from 'http'
import { randomUUID } from 'crypto'
import { Giver, JWTPayload } from '../types'
import { GiverService } from '../services/giver.service'
import { AuthService } from '../services/auth.service'

interface GiverConnection {
  giverId: string
  ws: WebSocket
  models: Set<string>
}

interface PendingRequest {
  giverId: string
  chunks: string[]
  resolve: (value: {
    response: string
    chunks: string[]
    giverId: string
  }) => void
  reject: (reason?: any) => void
  timeout: NodeJS.Timeout
}

class WebSocketManager {
  private static instance: WebSocketManager
  private wss: WebSocketServer | null = null
  private giverConnections: Map<string, GiverConnection> = new Map()
  private modelConnections: Map<string, GiverConnection[]> = new Map()
  private pendingRequests: Map<string, PendingRequest> = new Map()

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager()
    }
    return WebSocketManager.instance
  }

  initialize(wss: WebSocketServer): void {
    this.wss = wss
    this.wss.on('connection', this.handleConnection.bind(this))
    console.log('✅ WebSocket Manager initialized')
  }

  private updateModelConnections(
    connection: GiverConnection,
    models: string[],
  ): void {
    for (const [model, connections] of this.modelConnections.entries()) {
      const filtered = connections.filter(
        (entry) => entry.giverId !== connection.giverId,
      )
      if (filtered.length === 0) {
        this.modelConnections.delete(model)
      } else {
        this.modelConnections.set(model, filtered)
      }
    }

    connection.models = new Set(models)
    models.forEach((model) => {
      const trimmed = model.trim()
      if (!trimmed) {
        return
      }
      const list = this.modelConnections.get(trimmed) || []
      list.push(connection)
      this.modelConnections.set(trimmed, list)
    })
  }

  private async handleConnection(
    ws: WebSocket,
    req: IncomingMessage,
  ): Promise<void> {
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`)
      const role = url.searchParams.get('role')
      const giverId = url.searchParams.get('giverId')
      const giverName = url.searchParams.get('giverName')
      const token = url.searchParams.get('token')
      const payload = token ? AuthService.verifyToken(token) : null
      const modelsParam = url.searchParams.get('models')

      if (role === 'giver') {
        if (!token) {
          ws.close(1008, 'Token required')
          return
        }
        await this.handleGiverConnection(
          ws,
          giverId,
          giverName,
          payload,
          modelsParam,
        )
      } else {
        ws.close(1008, 'Invalid connection parameters')
      }
    } catch (error: any) {
      console.error('WebSocket connection error:', error)
      ws.close(1011, 'Internal server error')
    }
  }

  private async handleGiverConnection(
    ws: WebSocket,
    providedGiverId: string | null,
    giverName: string | null,
    payload: JWTPayload | null,
    modelsParam: string | null,
  ): Promise<void> {
    try {
      if (!payload || payload.type !== 'terminal') {
        ws.close(1008, 'Invalid token')
        return
      }

      const initialModels =
        modelsParam && modelsParam.length > 0
          ? modelsParam
              .split(',')
              .map((model) => model.trim())
              .filter(Boolean)
          : undefined

      let giverRecord = null

      if (providedGiverId) {
        const existing = await GiverService.getGiver(providedGiverId)
        if (existing) {
          if (existing.userId !== payload.userId) {
            ws.close(1008, 'Token does not match giver owner')
            return
          }
          giverRecord = await GiverService.upsertGiverFromConnection(
            payload.userId,
            giverName || existing.name,
            initialModels,
          )
        }
      }

      if (!giverRecord) {
        giverRecord = await GiverService.upsertGiverFromConnection(
          payload.userId,
          giverName,
          initialModels,
        )
      }

      if (!giverRecord) {
        ws.close(1011, 'Failed to initialize giver connection')
        return
      }

      this.registerConnection(ws, giverRecord, initialModels)
    } catch (error: any) {
      console.error('Error handling giver connection:', error)
      ws.close(1011, 'Internal server error')
    }
  }

  private registerConnection(
    ws: WebSocket,
    giver: Giver,
    initialModels?: string[],
  ): void {
    const giverId = giver.id
    console.log(`🔌 Giver connected: ${giverId}`)

    const connection: GiverConnection = {
      giverId,
      ws,
      models: new Set(),
    }

    this.giverConnections.set(giverId, connection)

    const modelsToTrack =
      initialModels && initialModels.length > 0
        ? initialModels
        : giver.models || []

    if (modelsToTrack.length > 0) {
      this.updateModelConnections(connection, modelsToTrack)
    }

    const statusModels = modelsToTrack.length > 0 ? modelsToTrack : undefined

    GiverService.setStatus(giverId, 'online', statusModels).catch((error) => {
      console.warn(`Failed to update giver status for ${giverId}:`, error)
    })

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString())
        await this.handleGiverMessage(connection, message)
      } catch (error) {
        console.error('Error handling giver message:', error)
      }
    })

    ws.on('close', async () => {
      console.log(`🔌 Giver disconnected: ${giverId}`)
      this.giverConnections.delete(giverId)
      this.updateModelConnections(connection, [])

      await GiverService.setStatus(giverId, 'offline')

      const pendingForGiver = Array.from(this.pendingRequests.entries()).filter(
        ([, pending]) => pending.giverId === giverId,
      )
      pendingForGiver.forEach(([requestId, pending]) => {
        clearTimeout(pending.timeout)
        pending.reject(new Error('Giver disconnected'))
        this.pendingRequests.delete(requestId)
      })
    })

    ws.on('error', (error) => {
      console.error(`Giver connection error (${giverId}):`, error)
    })
  }

  private async handleGiverMessage(
    connection: GiverConnection,
    message: any,
  ): Promise<void> {
    if (message.type === 'ping') {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify({ type: 'pong' }))
      }
      return
    }

    if (message.type === 'giver_ready') {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify({ type: 'giver_ready_ack' }))
      }
      return
    }

    const requestId = message.requestId
    if (!requestId || typeof requestId !== 'string') {
      return
    }

    const pending = this.pendingRequests.get(requestId)
    if (!pending) {
      return
    }

    switch (message.type) {
      case 'inference_chunk': {
        if (typeof message.chunk === 'string') {
          pending.chunks.push(message.chunk)
        }
        break
      }
      case 'inference_complete': {
        clearTimeout(pending.timeout)
        this.pendingRequests.delete(requestId)
        const response =
          typeof message.response === 'string'
            ? message.response
            : pending.chunks.join('')
        pending.resolve({
          response,
          chunks: pending.chunks,
          giverId: pending.giverId,
        })
        break
      }
      case 'inference_error': {
        clearTimeout(pending.timeout)
        this.pendingRequests.delete(requestId)
        pending.reject(
          new Error(
            typeof message.error === 'string'
              ? message.error
              : 'Inference request failed',
          ),
        )
        break
      }
      default:
        break
    }
  }

  async requestInference(
    model: string,
    payload: {
      prompt: string
      options?: Record<string, unknown>
      userId?: string
    },
    timeoutMs = 60_000,
  ): Promise<{ response: string; chunks: string[]; giverId: string }> {
    const trimmedModel = model.trim()
    if (!trimmedModel) {
      throw new Error('Model is required')
    }

    const candidates = (this.modelConnections.get(trimmedModel) || []).filter(
      (connection) => connection.ws.readyState === WebSocket.OPEN,
    )

    if (candidates.length === 0) {
      throw new Error(`No available giver for model: ${trimmedModel}`)
    }

    const connection = candidates[0]
    const ws = connection.ws

    if (ws.readyState !== WebSocket.OPEN) {
      throw new Error('Selected giver connection is not open')
    }

    const requestId = randomUUID()
    const message = {
      type: 'inference_request',
      requestId,
      model: trimmedModel,
      prompt: payload.prompt,
      options: payload.options,
      userId: payload.userId,
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error('Inference request timed out'))
      }, timeoutMs)

      this.pendingRequests.set(requestId, {
        giverId: connection.giverId,
        chunks: [],
        resolve,
        reject,
        timeout,
      })

      ws.send(JSON.stringify(message), (err) => {
        if (err) {
          clearTimeout(timeout)
          this.pendingRequests.delete(requestId)
          reject(
            new Error(
              `Failed to send inference request: ${
                err instanceof Error ? err.message : String(err)
              }`,
            ),
          )
        }
      })
    })
  }

  getGiverConnection(giverId: string): WebSocket | undefined {
    return this.giverConnections.get(giverId)?.ws
  }
}

export const webSocketManager = WebSocketManager.getInstance()

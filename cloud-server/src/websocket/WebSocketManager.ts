import { WebSocket, WebSocketServer } from 'ws'
import { IncomingMessage } from 'http'
import { Tunnel } from '../types'
import { TunnelService } from '../services/tunnel.service'
import { GiverService } from '../services/giver.service'
import { db } from '../db/mongo/init'

class WebSocketManager {
  private static instance: WebSocketManager
  private wss: WebSocketServer | null = null
  private giverConnections: Map<string, WebSocket> = new Map()
  private takerConnections: Map<string, WebSocket> = new Map()
  private tunnels: Map<string, Tunnel> = new Map()

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

  private async handleConnection(
    ws: WebSocket,
    req: IncomingMessage,
  ): Promise<void> {
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`)
      const role = url.searchParams.get('role')
      const giverId = url.searchParams.get('giverId')
      const tunnelId = url.searchParams.get('tunnelId')
      const token = url.searchParams.get('token')

      if (role === 'giver' && giverId) {
        await this.handleGiverConnection(ws, giverId, token)
      } else if (role === 'taker' && tunnelId && token) {
        await this.handleTakerConnection(ws, tunnelId, token)
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
    giverId: string,
    token: string | null,
  ): Promise<void> {
    try {
      if (token) {
        const { AuthService } = await import('../services/auth.service')
        const payload = AuthService.verifyToken(token)
        if (!payload) {
          ws.close(1008, 'Invalid token')
          return
        }
      }

      console.log(`🔌 Giver connected: ${giverId}`)
      this.giverConnections.set(giverId, ws)

      await GiverService.updateStatus(giverId, 'online')

      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString())
          await this.handleGiverMessage(giverId, message)
        } catch (error) {
          console.error('Error handling giver message:', error)
        }
      })

      ws.on('close', async () => {
        console.log(`🔌 Giver disconnected: ${giverId}`)
        this.giverConnections.delete(giverId)

        await GiverService.updateStatus(giverId, 'offline')

        const tunnels = Array.from(this.tunnels.values()).filter(
          (t) => t.giverId === giverId,
        )

        for (const tunnel of tunnels) {
          await this.reconnectTunnel(tunnel)
        }
      })

      ws.on('error', (error) => {
        console.error(`Giver connection error (${giverId}):`, error)
      })
    } catch (error: any) {
      console.error('Error handling giver connection:', error)
      ws.close(1011, 'Internal server error')
    }
  }

  private async handleTakerConnection(
    ws: WebSocket,
    tunnelId: string,
    token: string,
  ): Promise<void> {
    try {
      if (!token) {
        ws.close(1008, 'Token/API key required')
        return
      }

      const tunnelResult = await TunnelService.getTunnel(tunnelId)
      if (!tunnelResult) {
        ws.close(1008, 'Tunnel not found')
        return
      }

      const tunnelData = tunnelResult
      const model = tunnelData.model

      const giverResult = await GiverService.findGiverByModel(model)
      if (!giverResult) {
        ws.close(1008, `No available giver with model: ${model}`)
        await TunnelService.unassignGiver(tunnelId)
        return
      }

      const giver = giverResult
      const giverId = giver.id
      const giverWs = this.giverConnections.get(giverId)

      if (!giverWs || giverWs.readyState !== WebSocket.OPEN) {
        ws.close(1008, 'Giver not available')
        await TunnelService.unassignGiver(tunnelId)
        return
      }

      await TunnelService.assignGiver(tunnelId, giverId)

      console.log(
        `🔌 Connection established to tunnel: ${tunnelId} with giver: ${giverId} for model: ${model}`,
      )

      const tunnel: Tunnel = {
        id: tunnelId,
        giverId,
        model,
        giverWs,
        takerWs: ws,
        createdAt: new Date(tunnelData.createdAt),
        status: 'active',
      }

      this.tunnels.set(tunnelId, tunnel)
      this.takerConnections.set(tunnelId, ws)

      ws.on('message', (data: Buffer) => {
        if (giverWs.readyState === WebSocket.OPEN) {
          giverWs.send(data)
        }
      })

      giverWs.on('message', (data: Buffer) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data)
        }
      })

      ws.on('close', async () => {
        console.log(`🔌 Connection closed for tunnel: ${tunnelId}`)
        this.takerConnections.delete(tunnelId)
        this.tunnels.delete(tunnelId)
        await TunnelService.closeTunnel(tunnelId)
      })

      ws.on('error', (error) => {
        console.error(`Taker connection error (${tunnelId}):`, error)
      })
    } catch (error: any) {
      console.error('Error handling taker connection:', error)
      ws.close(1011, 'Internal server error')
    }
  }

  private async handleGiverMessage(
    giverId: string,
    message: any,
  ): Promise<void> {
    if (message.type === 'ping') {
      const ws = this.giverConnections.get(giverId)
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'pong' }))
      }
    }
  }

  private async reconnectTunnel(tunnel: Tunnel): Promise<void> {
    try {
      const giverResult = await GiverService.findGiverByModel(tunnel.model)
      if (!giverResult) {
        if (tunnel.takerWs && tunnel.takerWs.readyState === WebSocket.OPEN) {
          tunnel.takerWs.send(
            JSON.stringify({
              type: 'giver_disconnected',
              message: 'Giver disconnected, waiting for another giver...',
            }),
          )
        }
        await TunnelService.unassignGiver(tunnel.id)
        tunnel.status = 'waiting'
        tunnel.giverId = null
        tunnel.giverWs = undefined
        return
      }

      const newGiver = giverResult
      const newGiverWs = this.giverConnections.get(newGiver.id)

      if (!newGiverWs || newGiverWs.readyState !== WebSocket.OPEN) {
        await TunnelService.unassignGiver(tunnel.id)
        tunnel.status = 'waiting'
        tunnel.giverId = null
        tunnel.giverWs = undefined
        return
      }

      await TunnelService.assignGiver(tunnel.id, newGiver.id)

      tunnel.giverId = newGiver.id
      tunnel.giverWs = newGiverWs
      tunnel.status = 'active'

      if (tunnel.takerWs && tunnel.takerWs.readyState === WebSocket.OPEN) {
        tunnel.takerWs.send(
          JSON.stringify({
            type: 'giver_reconnected',
            message: `Reconnected to new giver: ${newGiver.name}`,
          }),
        )
      }

      if (tunnel.takerWs) {
        newGiverWs.on('message', (data: Buffer) => {
          if (tunnel.takerWs && tunnel.takerWs.readyState === WebSocket.OPEN) {
            tunnel.takerWs.send(data)
          }
        })

        tunnel.takerWs.on('message', (data: Buffer) => {
          if (newGiverWs.readyState === WebSocket.OPEN) {
            newGiverWs.send(data)
          }
        })
      }

      console.log(
        `🔄 Tunnel ${tunnel.id} reconnected to giver ${newGiver.id} for model ${tunnel.model}`,
      )
    } catch (error: any) {
      console.error(`Error reconnecting tunnel ${tunnel.id}:`, error)
      await TunnelService.unassignGiver(tunnel.id)
      tunnel.status = 'waiting'
      tunnel.giverId = null
      tunnel.giverWs = undefined
    }
  }

  getGiverConnection(giverId: string): WebSocket | undefined {
    return this.giverConnections.get(giverId)
  }

  getTakerConnection(tunnelId: string): WebSocket | undefined {
    return this.takerConnections.get(tunnelId)
  }
}

export const webSocketManager = WebSocketManager.getInstance()

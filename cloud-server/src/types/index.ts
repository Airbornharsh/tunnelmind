import { Request } from 'express'
import { WebSocket } from 'ws'

export interface JWTPayload {
  userId: string
  email: string
  type: 'user' | 'terminal'
  sessionId?: string
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload
}

export interface Giver {
  id: string
  userId: string
  name: string
  status: 'online' | 'offline'
  models: string[]
  lastSeen: Date
  endpoint?: string
}

export interface Tunnel {
  id: string
  giverId?: string | null
  model: string
  giverWs?: WebSocket
  takerWs?: WebSocket
  createdAt: Date
  status: 'active' | 'closed' | 'waiting'
}

export interface User {
  id: string
  email: string
  name: string
  password?: string
  createdAt: Date
  updatedAt: Date
}

export interface RegisterGiverRequest {
  name: string
  models: string[]
}

export interface CreateTunnelRequest {
  model: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiKeyInfo {
  id: string
  name: string
  prefix: string
  lastUsed?: Date
  createdAt: Date
}

export interface AvailableModel {
  model: string
  givers: {
    id: string
    name: string
    status: 'online' | 'offline'
  }[]
}

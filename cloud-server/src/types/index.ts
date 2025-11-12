import { Request } from 'express'
import { IUser } from '../db/mongo/models/User.schema'

export interface JWTPayload {
  userId: string
  email: string
  type: 'user' | 'terminal'
  sessionId?: string
}

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string
    id: string
    email: string
    name: string
    userId: string
    createdAt: Date
    updatedAt: Date
  }
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

export interface User {
  id: string
  email: string
  name: string
  password?: string
  createdAt: Date
  updatedAt: Date
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

export interface Chat {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
}

export interface ChatMessage {
  id: string
  chatId: string
  userId: string
  role: 'user' | 'assistant'
  content: string
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface AvailableModel {
  model: string
  givers: {
    id: string
    name: string
    status: 'online' | 'offline'
  }[]
}

import { getTerminalToken } from '@/utils/session'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6701'

function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  const storage = localStorage.getItem('tunnelmind-auth-storage')
  if (!storage) {
    return null
  }
  try {
    const parsed = JSON.parse(storage)
    return parsed?.state?.token || null
  } catch {
    return null
  }
}

const axiosInstance = axios.create({
  baseURL: API_URL,
})

axiosInstance.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('tunnelmind-auth-storage')
          ? JSON.parse(localStorage.getItem('tunnelmind-auth-storage') || '{}')
              .state?.token
          : null
        : null

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tunnelmind-auth-storage')
      }
    }
    return Promise.reject(error)
  },
)

export interface User {
  id: string
  email: string
  name: string
}

export interface Giver {
  id: string
  name: string
  status: 'online' | 'offline'
  models: string[]
  lastSeen: string
}

export interface AvailableModel {
  model: string
  givers: {
    id: string
    name: string
    status: 'online' | 'offline'
  }[]
}

export interface Chat {
  id: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  chatId: string
  userId: string
  role: 'user' | 'assistant'
  content: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasMore: boolean
}

export interface InferenceResult {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export const api = {
  async login(
    email: string,
    password: string,
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await axiosInstance.post('/api/auth/login', {
      email,
      password,
    })
    return response.data
  },

  async register(
    email: string,
    password: string,
    name: string,
  ): Promise<ApiResponse<{ user: User; token: string; apiKey?: string }>> {
    const response = await axiosInstance.post('/api/auth/register', {
      email,
      password,
      name,
    })
    return response.data
  },

  async getCurrentUser(
    token: string,
  ): Promise<ApiResponse<{ userId: string; email: string; name?: string }>> {
    const response = await axiosInstance.get('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  },

  async getGivers(): Promise<Giver[]> {
    const response = await axiosInstance.get('/api/giver')
    return response.data.data || []
  },

  async getAvailableModels(): Promise<AvailableModel[]> {
    const response = await axiosInstance.get('/api/taker/models')
    return response.data.data || []
  },

  async requestInference(
    model: string,
    prompt: string,
    apiKey?: string,
  ): Promise<InferenceResult> {
    const headers: Record<string, string> = {}
    if (apiKey) {
      headers['X-API-Key'] = apiKey
    }

    const response = await axiosInstance.post(
      '/api/v1/chat/completions',
      {
        model,
        prompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers,
      },
    )

    return response.data
  },

  async createApiKey(
    name: string,
  ): Promise<ApiResponse<{ apiKey: string; info: ApiKeyInfo }>> {
    const response = await axiosInstance.post('/api/api-keys', { name })
    return response.data
  },

  async getApiKeys(): Promise<ApiResponse<{ apiKeys: ApiKeyInfo[] }>> {
    const response = await axiosInstance.get('/api/api-keys')
    return response.data
  },

  async getApiKey(
    id: string,
  ): Promise<ApiResponse<{ apiKey: ApiKeyInfo & { key: string } }>> {
    const response = await axiosInstance.get(`/api/api-keys/${id}`)
    return response.data
  },

  async deleteApiKey(id: string): Promise<ApiResponse> {
    const response = await axiosInstance.delete(`/api/api-keys/${id}`)
    return response.data
  },

  async completeTerminalSession(): Promise<void> {
    await axiosInstance.post(`/api/auth/session/${getTerminalToken()}`)
  },

  async getChats(
    page = 1,
    limit = 20,
  ): Promise<{ chats: Chat[]; pagination: PaginationMeta | null }> {
    const response = await axiosInstance.get('/api/chats', {
      params: {
        page,
        limit,
      },
    })
    const data = response.data?.data || {}
    return {
      chats: data.chats || [],
      pagination: data.pagination || null,
    }
  },

  async createChat(title?: string): Promise<Chat> {
    const response = await axiosInstance.post('/api/chats', { title })
    return response.data?.data?.chat
  },

  async updateChatTitle(id: string, title: string): Promise<Chat> {
    const response = await axiosInstance.patch(`/api/chats/${id}`, { title })
    return response.data?.data?.chat
  },

  async getChat(
    id: string,
    page = 1,
    limit = 50,
  ): Promise<{
    chat: Chat
    messages: ChatMessage[]
    pagination: PaginationMeta | null
  } | null> {
    const response = await axiosInstance.get(`/api/chats/${id}`, {
      params: {
        page,
        limit,
      },
    })
    const data = response.data?.data
    if (!data) {
      return null
    }
    return {
      chat: data.chat,
      messages: data.messages || [],
      pagination: data.pagination || null,
    }
  },

  async sendChatMessage(
    id: string,
    content: string,
    model: string,
  ): Promise<{
    chat: Chat
    userMessage: ChatMessage
    assistantMessage: ChatMessage | null
  }> {
    const response = await axiosInstance.post(`/api/chats/${id}/messages`, {
      content,
      model,
    })
    return response.data?.data
  },

  async streamChatMessage(
    id: string,
    content: string,
    model: string,
    handlers: {
      onUser?: (payload: { chat: Chat; userMessage: ChatMessage }) => void
      onChunk?: (payload: { chatId: string; chunk: string }) => void
      onAssistant?: (payload: {
        chat: Chat
        assistantMessage: ChatMessage
      }) => void
      onError?: (message: string) => void
      onDone?: () => void
    },
  ): Promise<void> {
    const token = getAuthToken()
    const controller = new AbortController()
    try {
      const response = await fetch(
        `${API_URL}/api/chats/${id}/messages?stream=true`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content, model, stream: true }),
          signal: controller.signal,
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to send chat message')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Streaming not supported by the server')
      }

      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) {
          break
        }
        buffer += decoder.decode(value, { stream: true })
        let separatorIndex: number
        while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, separatorIndex).trim()
          buffer = buffer.slice(separatorIndex + 2)
          if (!rawEvent.startsWith('data:')) {
            continue
          }
          const payload = rawEvent.replace(/^data:\s*/, '')
          if (payload === '[DONE]') {
            handlers.onDone?.()
            return
          }
          try {
            const eventData = JSON.parse(payload) as Record<string, unknown>
            switch (eventData?.type) {
              case 'user':
                handlers.onUser?.({
                  chat: eventData.chat as Chat,
                  userMessage: eventData.userMessage as ChatMessage,
                })
                break
              case 'chunk':
                handlers.onChunk?.({
                  chatId: String(eventData.chatId ?? ''),
                  chunk: String(eventData.chunk ?? ''),
                })
                break
              case 'assistant':
                handlers.onAssistant?.({
                  chat: eventData.chat as Chat,
                  assistantMessage: eventData.assistantMessage as ChatMessage,
                })
                break
              case 'error':
                handlers.onError?.(
                  typeof eventData.error === 'string'
                    ? eventData.error
                    : 'Failed to generate response',
                )
                break
              default:
                break
            }
          } catch (streamError) {
            console.warn('Failed to parse streaming event', streamError)
          }
        }
      }

      handlers.onDone?.()
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to stream message'
      handlers.onError?.(message)
      throw error
    } finally {
      controller.abort()
    }
  },
}

export interface ApiKeyInfo {
  id: string
  name: string
  prefix: string
  lastUsed?: Date
  createdAt: Date
}

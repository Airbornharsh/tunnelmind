import { getTerminalToken } from '@/utils/session'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6701'

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

export interface InferenceResult {
  response: string
  chunks: string[]
  giverId?: string
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
    options?: Record<string, unknown>,
    apiKey?: string,
  ): Promise<InferenceResult> {
    const headers: Record<string, string> = {}
    if (apiKey) {
      headers['X-API-Key'] = apiKey
    }

    const response = await axiosInstance.post(
      '/api/taker/inference',
      {
        model,
        prompt,
        options,
      },
      {
        headers,
      },
    )

    return response.data.data
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
}

export interface ApiKeyInfo {
  id: string
  name: string
  prefix: string
  lastUsed?: Date
  createdAt: Date
}

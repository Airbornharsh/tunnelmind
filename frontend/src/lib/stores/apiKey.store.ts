import { create } from 'zustand'
import { api, ApiKeyInfo } from '@/lib/api'

interface ApiKeyState {
  apiKeys: ApiKeyInfo[]
  loading: boolean
  error: string | null
  fetchApiKeys: () => Promise<void>
  createApiKey: (
    name: string,
  ) => Promise<{ apiKey: string; info: ApiKeyInfo } | null>
  deleteApiKey: (id: string) => Promise<void>
  clearError: () => void
}

export const useApiKeyStore = create<ApiKeyState>((set, get) => ({
  apiKeys: [],
  loading: false,
  error: null,

  fetchApiKeys: async () => {
    set({ loading: true, error: null })
    try {
      const result = await api.getApiKeys()
      if (result.success && result.data) {
        set({
          apiKeys: result.data.apiKeys,
          loading: false,
          error: null,
        })
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to fetch API keys',
        })
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch API keys'
      set({
        loading: false,
        error: errorMessage,
      })
    }
  },

  createApiKey: async (name: string) => {
    set({ loading: true, error: null })
    try {
      const result = await api.createApiKey(name)
      if (result.success && result.data) {
        await get().fetchApiKeys()
        set({ loading: false, error: null })
        return result.data
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to create API key',
        })
        return null
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create API key'
      set({
        loading: false,
        error: errorMessage,
      })
      return null
    }
  },

  deleteApiKey: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const result = await api.deleteApiKey(id)
      if (result.success) {
        await get().fetchApiKeys()
        set({ loading: false, error: null })
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to delete API key',
        })
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete API key'
      set({
        loading: false,
        error: errorMessage,
      })
    }
  },

  clearError: () => set({ error: null }),
}))

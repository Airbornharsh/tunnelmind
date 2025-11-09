import { create } from 'zustand'
import { api, AvailableModel } from '@/lib/api'

interface ModelsState {
  availableModels: AvailableModel[]
  loading: boolean
  error: string | null
  lastFetched: number | null
  fetchModels: () => Promise<void>
  getModelByName: (modelName: string) => AvailableModel | undefined
}

export const useModelsStore = create<ModelsState>((set, get) => ({
  availableModels: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetchModels: async () => {
    set({ loading: true, error: null })
    try {
      const models = await api.getAvailableModels()
      set({
        availableModels: models,
        loading: false,
        lastFetched: Date.now(),
        error: null,
      })
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to load models',
      })
    }
  },

  getModelByName: (modelName: string) => {
    return get().availableModels.find((m) => m.model === modelName)
  },
}))

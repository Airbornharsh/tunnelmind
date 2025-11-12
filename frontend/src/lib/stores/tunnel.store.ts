/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand'
import { api } from '@/lib/api'

interface ActiveSession {
  model: string
  giverId?: string
}

interface TunnelState {
  tunnel: ActiveSession | null
  error: string | null
  response: string
  loading: boolean
  currentModel: string | null
  apiKey?: string
  requestInference: (
    prompt: string,
    model: string,
    apiKey?: string,
  ) => Promise<void>
  clearResponse: () => void
}

export const useTunnelStore = create<TunnelState>((set, get) => ({
  tunnel: null,
  error: null,
  response: '',
  loading: false,
  currentModel: null,
  apiKey: undefined,

  requestInference: async (prompt: string, model: string, apiKey?: string) => {
    const state = get()
    const trimmedModel = (model || '').trim()
    const activeModel = trimmedModel || state.currentModel

    if (!activeModel) {
      set({ error: 'Model is required' })
      return
    }

    const trimmedPrompt = prompt?.trim()
    if (!trimmedPrompt) {
      set({ error: 'Prompt is required' })
      return
    }

    set({
      loading: true,
      error: null,
      response: '',
      apiKey: apiKey ?? state.apiKey,
      currentModel: activeModel,
      tunnel: { model: activeModel, giverId: state.tunnel?.giverId },
    })

    try {
      const result = await api.requestInference(
        activeModel,
        trimmedPrompt,
        apiKey ?? state.apiKey,
      )

      set({
        loading: false,
        response: result.choices[0].message.content,
      })
    } catch (error: any) {
      set({
        loading: false,
        error: error?.message || 'Failed to process inference request',
      })
    }
  },

  clearResponse: () => {
    set({ response: '' })
  },
}))

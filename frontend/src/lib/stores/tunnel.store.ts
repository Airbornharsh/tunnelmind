import { create } from 'zustand'
import { api, Tunnel } from '@/lib/api'

interface TunnelState {
  tunnel: Tunnel | null
  ws: WebSocket | null
  connected: boolean
  connecting: boolean
  error: string | null
  response: string
  loading: boolean
  connect: (model: string, apiKey?: string) => Promise<void>
  disconnect: () => void
  sendMessage: (prompt: string, model: string, options?: any) => void
  clearResponse: () => void
}

export const useTunnelStore = create<TunnelState>((set, get) => ({
  tunnel: null,
  ws: null,
  connected: false,
  connecting: false,
  error: null,
  response: '',
  loading: false,

  connect: async (model: string, apiKey?: string) => {
    const state = get()
    if (state.connecting || state.connected) return

    set({ connecting: true, error: null })

    try {
      const tunnel = await api.createTunnel(model, apiKey)

      const wsUrl = tunnel.wsUrl
        .replace('http://', 'ws://')
        .replace('https://', 'wss://')

      const websocket = new WebSocket(wsUrl)

      websocket.onopen = () => {
        set({
          connected: true,
          connecting: false,
          tunnel,
          ws: websocket,
          error: null,
        })
      }

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'inference_chunk') {
            set((state) => ({
              response: state.response + data.chunk,
            }))
          } else if (data.type === 'inference_complete') {
            set({
              response: data.response,
              loading: false,
            })
          } else if (data.type === 'inference_error') {
            set({
              error: data.error,
              loading: false,
            })
          } else if (data.type === 'giver_disconnected') {
            set((state) => ({
              response: state.response + '\n\n⚠️ ' + data.message,
            }))
          } else if (data.type === 'giver_reconnected') {
            set((state) => ({
              response: state.response + '\n\n✅ ' + data.message,
            }))
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
        set({
          connecting: false,
          connected: false,
          error: 'WebSocket connection error',
        })
      }

      websocket.onclose = () => {
        set({
          connected: false,
          connecting: false,
          ws: null,
          tunnel: null,
        })
      }
    } catch (error: any) {
      set({
        connecting: false,
        error: error.message || 'Failed to create tunnel',
      })
    }
  },

  disconnect: () => {
    const state = get()
    if (state.ws) {
      state.ws.close()
    }
    set({
      connected: false,
      connecting: false,
      ws: null,
      tunnel: null,
      response: '',
      error: null,
    })
  },

  sendMessage: (prompt: string, model: string, options?: any) => {
    const state = get()
    if (
      !state.ws ||
      !state.connected ||
      state.ws.readyState !== WebSocket.OPEN
    ) {
      set({ error: 'Not connected to tunnel' })
      return
    }

    set({ response: '', loading: true, error: null })

    const message = {
      type: 'inference_request',
      requestId: Date.now().toString(),
      model,
      prompt,
      options: options || {
        temperature: 0.7,
      },
    }

    state.ws.send(JSON.stringify(message))
  },

  clearResponse: () => {
    set({ response: '' })
  },
}))

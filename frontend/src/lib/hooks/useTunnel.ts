import { useCallback } from 'react'
import { useTunnelStore } from '@/lib/stores/tunnel.store'
import { useUIStore } from '@/lib/stores/ui.store'

export function useTunnel() {
  const { tunnel, error, response, loading, requestInference, clearResponse } =
    useTunnelStore()

  const { selectedModel, apiKey, prompt, setPrompt } = useUIStore()

  const handleSend = useCallback(() => {
    if (!prompt || !selectedModel) return
    requestInference(prompt, selectedModel, apiKey || undefined)
    setPrompt('')
  }, [prompt, selectedModel, apiKey, requestInference, setPrompt])

  return {
    tunnel,
    error,
    response,
    loading,
    sendMessage: handleSend,
    clearResponse,
  }
}

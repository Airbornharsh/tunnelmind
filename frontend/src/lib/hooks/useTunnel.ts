import { useCallback } from 'react'
import { useTunnelStore } from '@/lib/stores/tunnel.store'
import { useUIStore } from '@/lib/stores/ui.store'

export function useTunnel() {
  const {
    tunnel,
    connected,
    connecting,
    error,
    response,
    loading,
    connect,
    disconnect,
    sendMessage,
    clearResponse,
  } = useTunnelStore()

  const { selectedModel, apiKey, prompt, setPrompt } = useUIStore()

  const handleConnect = useCallback(async () => {
    if (!selectedModel) return
    await connect(selectedModel, apiKey || undefined)
  }, [selectedModel, apiKey, connect])

  const handleDisconnect = useCallback(() => {
    disconnect()
  }, [disconnect])

  const handleSend = useCallback(() => {
    if (!prompt || !selectedModel) return
    sendMessage(prompt, selectedModel)
    setPrompt('')
  }, [prompt, selectedModel, sendMessage, setPrompt])

  return {
    tunnel,
    connected,
    connecting,
    error,
    response,
    loading,
    connect: handleConnect,
    disconnect: handleDisconnect,
    sendMessage: handleSend,
    clearResponse,
  }
}

import { useEffect } from 'react'
import { useModelsStore } from '@/lib/stores/models.store'

export function useModels() {
  const {
    availableModels,
    loading,
    error,
    lastFetched,
    fetchModels,
    getModelByName,
  } = useModelsStore()

  useEffect(() => {
    fetchModels()

    const interval = setInterval(() => {
      fetchModels()
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchModels])

  return {
    availableModels,
    loading,
    error,
    lastFetched,
    refetch: fetchModels,
    getModelByName,
  }
}

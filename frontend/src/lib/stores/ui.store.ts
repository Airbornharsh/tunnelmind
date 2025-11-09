import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UIState {
  selectedModel: string
  apiKey: string
  prompt: string
  setSelectedModel: (model: string) => void
  setApiKey: (key: string) => void
  setPrompt: (prompt: string) => void
  clearSelection: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedModel: '',
      apiKey: '',
      prompt: '',

      setSelectedModel: (model: string) => set({ selectedModel: model }),
      setApiKey: (key: string) => set({ apiKey: key }),
      setPrompt: (prompt: string) => set({ prompt }),
      clearSelection: () => set({ selectedModel: '', prompt: '' }),
    }),
    {
      name: 'tunnelmind-ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: UIState) => ({
        apiKey: state.apiKey,
        selectedModel: state.selectedModel,
      }),
    },
  ),
)

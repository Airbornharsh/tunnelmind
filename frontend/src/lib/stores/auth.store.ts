import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { api, User } from '@/lib/api'
import { getTerminalToken } from '@/utils/session'

interface AuthState {
  authLoaded: boolean
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  isTerminalSessionLoading: boolean

  setAuthLoaded: (loaded: boolean) => void
  login: (email: string, password: string) => Promise<void>
  register: (
    email: string,
    password: string,
    name: string,
  ) => Promise<string | null>
  logout: () => void
  checkAuth: () => Promise<void>
  completeTerminalSession: () => Promise<void>
  checkLocalTerminalSession: () => boolean
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      authLoaded: false,
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      isTerminalSessionLoading: false,

      setAuthLoaded: (loaded: boolean) => {
        set({
          authLoaded: loaded,
        })
      },

      login: async (email: string, password: string) => {
        set({ loading: true, error: null })
        try {
          const result = await api.login(email, password)
          if (result.success && result.data) {
            set({
              user: result.data.user,
              token: result.data.token,
              isAuthenticated: true,
              loading: false,
              error: null,
            })
          } else {
            set({
              loading: false,
              error: result.error || 'Login failed',
            })
            throw new Error(result.error || 'Login failed')
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Login failed'
          set({
            loading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ loading: true, error: null })
        try {
          const result = await api.register(email, password, name)
          if (result.success && result.data) {
            set({
              user: result.data.user,
              token: result.data.token,
              isAuthenticated: true,
              loading: false,
              error: null,
            })
            return result.data.apiKey || null
          } else {
            set({
              loading: false,
              error: result.error || 'Registration failed',
            })
            throw new Error(result.error || 'Registration failed')
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Registration failed'
          set({
            loading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }

        set({ loading: true })
        try {
          const result = await api.getCurrentUser(token)
          if (result.success && result.data) {
            set({
              user: {
                id: result.data.userId,
                email: result.data.email,
                name: result.data.name || '',
              },
              isAuthenticated: true,
              loading: false,
            })
          } else {
            set({
              isAuthenticated: false,
              user: null,
              token: null,
              loading: false,
            })
          }
        } catch {
          set({
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
          })
        }
      },

      completeTerminalSession: async () => {
        set({ isTerminalSessionLoading: true })
        try {
          await api.completeTerminalSession()
        } catch (error) {
          console.error('Error completing terminal session:', error)
        } finally {
          set({ isTerminalSessionLoading: false })
        }
      },

      checkLocalTerminalSession: () => {
        const token = getTerminalToken()
        if (token) {
          return true
        }
        return false
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'tunnelmind-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: AuthState) => ({
        token: state.token,
      }),
    },
  ),
)

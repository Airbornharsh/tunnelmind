/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand'
import { api, Chat, ChatMessage, PaginationMeta } from '@/lib/api'

interface ChatState {
  chats: Chat[]
  chatPagination: PaginationMeta | null
  currentChat: Chat | null
  messages: ChatMessage[]
  messagesPagination: PaginationMeta | null
  loading: boolean
  sending: boolean
  error: string | null
  fetchChats: (page?: number, append?: boolean) => Promise<void>
  loadMoreChats: () => Promise<void>
  createChat: (title?: string) => Promise<Chat | null>
  updateChatTitle: (id: string, title: string) => Promise<void>
  fetchChat: (id: string, page?: number, append?: boolean) => Promise<void>
  loadMoreMessages: (id: string) => Promise<void>
  sendMessage: (id: string, content: string, model: string) => Promise<void>
  resetChat: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  chatPagination: null,
  currentChat: null,
  messages: [],
  messagesPagination: null,
  loading: false,
  sending: false,
  error: null,

  fetchChats: async (page = 1, append = false) => {
    set({
      loading: !append,
      error: null,
    })

    try {
      const result = await api.getChats(page)
      set((state) => ({
        chats: append
          ? [
              ...state.chats,
              ...result.chats.filter(
                (chat) =>
                  !state.chats.some((existing) => existing.id === chat.id),
              ),
            ]
          : result.chats,
        chatPagination: result.pagination,
        loading: false,
      }))
    } catch (error: any) {
      set({
        loading: false,
        error: error?.message || 'Failed to load chats',
      })
    }
  },

  loadMoreChats: async () => {
    const { chatPagination, fetchChats } = get()
    if (chatPagination?.hasMore) {
      await fetchChats(chatPagination.page + 1, true)
    }
  },

  createChat: async (title?: string) => {
    try {
      const chat = await api.createChat(title)
      if (chat) {
        await get().fetchChats(1)
        return chat
      }
      return null
    } catch (error: any) {
      set({ error: error?.message || 'Failed to create chat' })
      return null
    }
  },

  updateChatTitle: async (id: string, title: string) => {
    try {
      const chat = await api.updateChatTitle(id, title)
      set((state) => ({
        chats: state.chats.map((existing) =>
          existing.id === chat.id ? chat : existing,
        ),
        currentChat:
          state.currentChat && state.currentChat.id === chat.id
            ? chat
            : state.currentChat,
      }))
    } catch (error: any) {
      set({ error: error?.message || 'Failed to update chat title' })
    }
  },

  fetchChat: async (id: string, page = 1, append = false) => {
    set({ loading: !append, error: null })
    try {
      const result = await api.getChat(id, page)
      if (result) {
        set((state) => ({
          currentChat: result.chat,
          messages: append
            ? [
                ...result.messages.filter(
                  (message) =>
                    !state.messages.some(
                      (existing) => existing.id === message.id,
                    ),
                ),
                ...state.messages,
              ]
            : result.messages,
          messagesPagination: result.pagination,
          loading: false,
        }))
      } else {
        set({
          loading: false,
          error: 'Chat not found',
        })
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error?.message || 'Failed to load chat',
      })
    }
  },

  loadMoreMessages: async (id: string) => {
    const { messagesPagination, fetchChat } = get()
    if (messagesPagination?.hasMore) {
      await fetchChat(id, messagesPagination.page + 1, true)
    }
  },

  sendMessage: async (id: string, content: string, model: string) => {
    const trimmedContent = content.trim()
    const trimmedModel = model.trim()
    if (!trimmedContent || !trimmedModel) {
      return
    }

    const tempAssistantId = `temp-${Date.now()}`
    let userMessage: ChatMessage | null = null

    set({ sending: true, error: null })

    try {
      await api.streamChatMessage(id, trimmedContent, trimmedModel, {
        onUser: ({ chat, userMessage: serverUserMessage }) => {
          userMessage = serverUserMessage
          set((state) => ({
            currentChat: chat,
            messages: [...state.messages, serverUserMessage],
            messagesPagination: state.messagesPagination
              ? {
                  ...state.messagesPagination,
                  total: state.messagesPagination.total + 1,
                  totalPages: Math.max(
                    state.messagesPagination.totalPages,
                    Math.ceil(
                      (state.messagesPagination.total + 1) /
                        state.messagesPagination.pageSize,
                    ),
                  ),
                }
              : state.messagesPagination,
          }))
        },
        onChunk: ({ chunk }) => {
          if (!chunk) {
            return
          }
          set((state) => {
            const existingIndex = state.messages.findIndex(
              (message) => message.id === tempAssistantId,
            )
            const now = new Date().toISOString()
            if (existingIndex === -1) {
              const assistantMessage: ChatMessage = {
                id: tempAssistantId,
                chatId: userMessage?.chatId || id,
                userId: userMessage?.userId || '',
                role: 'assistant',
                content: chunk,
                createdAt: now,
                updatedAt: now,
              }
              return {
                ...state,
                messages: [...state.messages, assistantMessage],
              }
            }

            const messages = [...state.messages]
            const current = messages[existingIndex]
            messages[existingIndex] = {
              ...current,
              content: (current.content || '') + chunk,
              updatedAt: now,
            }
            return {
              ...state,
              messages,
            }
          })
        },
        onAssistant: ({ chat, assistantMessage }) => {
          set((state) => {
            const filtered = state.messages.filter(
              (message) => message.id !== tempAssistantId,
            )
            const updatedPagination = state.messagesPagination
              ? {
                  ...state.messagesPagination,
                  total: state.messagesPagination.total + 1,
                  totalPages: Math.max(
                    state.messagesPagination.totalPages,
                    Math.ceil(
                      (state.messagesPagination.total + 1) /
                        state.messagesPagination.pageSize,
                    ),
                  ),
                }
              : state.messagesPagination

            return {
              currentChat: chat,
              messages: [...filtered, assistantMessage],
              messagesPagination: updatedPagination,
            }
          })
        },
        onError: (message) => {
          set({ error: message })
        },
        onDone: () => {
          set({ sending: false })
        },
      })
    } catch (error: any) {
      set({
        sending: false,
        error: error?.message || 'Failed to send message',
      })
    } finally {
      set((state) => ({
        sending: false,
        messages: state.messages.filter(
          (message) => message.id !== tempAssistantId,
        ),
      }))
    }
  },

  resetChat: () => {
    set({
      currentChat: null,
      messages: [],
      messagesPagination: null,
    })
  },
}))

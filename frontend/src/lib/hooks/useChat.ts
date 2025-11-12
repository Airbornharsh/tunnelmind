import { useCallback } from 'react'
import { useChatStore } from '@/lib/stores/chat.store'

export function useChat() {
  const {
    chats,
    chatPagination,
    currentChat,
    messages,
    messagesPagination,
    loading,
    sending,
    error,
    fetchChats,
    loadMoreChats,
    createChat,
    updateChatTitle,
    fetchChat,
    loadMoreMessages,
    sendMessage,
    resetChat,
  } = useChatStore()

  const handleFetchChats = useCallback(
    async (page = 1, append = false) => {
      await fetchChats(page, append)
    },
    [fetchChats],
  )

  const handleLoadMoreChats = useCallback(async () => {
    await loadMoreChats()
  }, [loadMoreChats])

  const handleCreateChat = useCallback(
    async (title?: string) => {
      return createChat(title)
    },
    [createChat],
  )

  const handleUpdateChatTitle = useCallback(
    async (id: string, title: string) => {
      await updateChatTitle(id, title)
    },
    [updateChatTitle],
  )

  const handleFetchChat = useCallback(
    async (id: string, page = 1, append = false) => {
      await fetchChat(id, page, append)
    },
    [fetchChat],
  )

  const handleLoadMoreMessages = useCallback(
    async (id: string) => {
      await loadMoreMessages(id)
    },
    [loadMoreMessages],
  )

  const handleSendMessage = useCallback(
    async (id: string, content: string, model: string) => {
      await sendMessage(id, content, model)
    },
    [sendMessage],
  )

  return {
    chats,
    chatPagination,
    currentChat,
    messages,
    messagesPagination,
    loading,
    sending,
    error,
    fetchChats: handleFetchChats,
    loadMoreChats: handleLoadMoreChats,
    createChat: handleCreateChat,
    updateChatTitle: handleUpdateChatTitle,
    fetchChat: handleFetchChat,
    loadMoreMessages: handleLoadMoreMessages,
    sendMessage: handleSendMessage,
    resetChat,
  }
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChat } from '@/lib/hooks/useChat'

export default function ChatsPage() {
  const {
    chats,
    chatPagination,
    loading,
    error,
    fetchChats,
    loadMoreChats,
    createChat,
  } = useChat()
  const [newChatTitle, setNewChatTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  const handleCreateChat = async () => {
    if (creating) {
      return
    }
    setCreating(true)
    try {
      const chat = await createChat(newChatTitle || undefined)
      if (chat) {
        setNewChatTitle('')
        router.push(`/chats/${chat.id}`)
      }
    } finally {
      setCreating(false)
    }
  }

  const handleLoadMore = async () => {
    if (loadingMore || !chatPagination?.hasMore) {
      return
    }
    setLoadingMore(true)
    try {
      await loadMoreChats()
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={newChatTitle}
          onChange={(event) => setNewChatTitle(event.target.value)}
          placeholder="Chat title"
          className="w-full sm:w-72"
        />
        <Button onClick={handleCreateChat} disabled={creating}>
          {creating ? 'Creating…' : 'New Chat'}
        </Button>
      </div>

      {loading && !chatPagination && (
        <p className="text-muted-foreground">Loading chats…</p>
      )}
      {error && <p className="text-destructive">{error}</p>}

      <div className="space-y-3">
        {chats.length === 0 && !loading ? (
          <p className="text-muted-foreground">
            No chats yet. Create one above.
          </p>
        ) : (
          chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/chats/${chat.id}`}
              className="block rounded-md border border-border bg-card p-4 shadow-sm transition hover:border-primary"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium">{chat.title}</h2>
                <span className="text-xs text-muted-foreground">
                  {new Date(chat.updatedAt).toLocaleString()}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {chatPagination?.hasMore && (
        <Button
          onClick={handleLoadMore}
          disabled={loadingMore}
          variant="outline"
        >
          {loadingMore ? 'Loading…' : 'Load more chats'}
        </Button>
      )}
    </div>
  )
}

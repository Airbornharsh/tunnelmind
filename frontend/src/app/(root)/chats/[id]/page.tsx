'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useChat } from '@/lib/hooks/useChat'
import { useModels } from '@/lib/hooks/useModels'
import { Loader2 } from 'lucide-react'

export default function ChatDetailPage() {
  const params = useParams<{ id: string | string[] }>()
  const chatId = useMemo(() => {
    const value = params?.id
    if (!value) {
      return undefined
    }
    return Array.isArray(value) ? value[0] : value
  }, [params])

  const {
    messages,
    messagesPagination,
    loading,
    sending,
    fetchChat,
    loadMoreMessages,
    sendMessage,
    resetChat,
  } = useChat()
  const { availableModels } = useModels()

  const [input, setInput] = useState('')
  const [model, setModel] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const messageEndRef = useRef<HTMLDivElement | null>(null)
  const messageContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (availableModels.length > 0 && !model) {
      setModel(availableModels[0].model)
    }
  }, [availableModels, model])

  useEffect(() => {
    if (chatId) {
      fetchChat(chatId)
    }
    return () => {
      resetChat()
    }
  }, [chatId, fetchChat, resetChat])

  useEffect(() => {
    if (loadingMore) {
      return
    }
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loadingMore])

  const handleSend = async () => {
    if (!chatId || !input.trim() || !model.trim()) {
      return
    }
    await sendMessage(chatId, input.trim(), model.trim())
    setInput('')
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  const handleLoadMore = async () => {
    if (!chatId || loadingMore || !messagesPagination?.hasMore) {
      return
    }
    setLoadingMore(true)
    const container = messageContainerRef.current
    const prevScrollHeight = container?.scrollHeight || 0
    try {
      await loadMoreMessages(chatId)
    } finally {
      if (container) {
        const newScrollHeight = container.scrollHeight
        container.scrollTop += newScrollHeight - prevScrollHeight
      }
      setLoadingMore(false)
    }
  }

  if (!chatId) {
    return null
  }

  return (
    <div className="flex h-full flex-col relative overflow-hidden">
      <div
        ref={messageContainerRef}
        className="overflow-y-auto bg-muted/20 py-2 h-[calc(100vh-5rem)] pb-40"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {messagesPagination?.hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : 'Load more messages'}
              </Button>
            </div>
          )}

          {loading && messages.length === 0 && (
            <p className="text-center text-muted-foreground">
              Loading messages…
            </p>
          )}

          {!loading && messages.length === 0 && (
            <p className="text-center text-muted-foreground">
              No messages yet. Start the conversation below.
            </p>
          )}

          {messages.map((message) => {
            const isUser = message.role === 'user'
            return (
              <div
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xl rounded-2xl px-4 py-3 text-sm shadow-sm ${isUser ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card text-foreground rounded-bl-sm'}`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>
                  <div className="mt-2 text-xs opacity-70">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messageEndRef} />
        </div>
      </div>

      <div className="absolute bottom-0 left-[50%] right-0 translate-x-[-50%]">
        <div className="relative rounded-2xl border border-border/60 bg-card shadow-lg pt-1 pb-12">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message the assistant…"
            rows={5}
            className="resize-none border-none bg-transparent shadow-none focus-visible:ring-0 h-8"
          />
          <div className="absolute bottom-1 right-1 flex items-center gap-2">
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent align="end">
                {availableModels.map((item) => (
                  <SelectItem key={item.model} value={item.model}>
                    {item.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              onClick={handleSend}
              disabled={sending || !input.trim() || !model.trim()}
              className="h-10 w-10 rounded-full"
            >
              {sending ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <span className="text-lg">↑</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

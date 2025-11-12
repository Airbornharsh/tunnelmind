'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  LayoutDashboard,
  Zap,
  Share2,
  LogOut,
  User,
  ChevronDown,
  Plus,
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button } from '@/components/ui/button'
import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@/lib/hooks/useChat'

export function Sidebar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const {
    chats,
    chatPagination,
    loading,
    error,
    fetchChats,
    loadMoreChats,
    createChat,
  } = useChat()
  const [chatsOpen, setChatsOpen] = useState(true)
  const [creatingChat, setCreatingChat] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const chatsScrollRef = useRef<HTMLDivElement | null>(null)

  const handleLogout = () => {
    logout()
    router.push('/auth')
  }

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  const currentTab =
    pathname === '/taker'
      ? 'taker'
      : pathname === '/giver'
        ? 'giver'
        : pathname === '/'
          ? 'dashboard'
          : 'dashboard'

  const navigation = [
    {
      name: 'Dashboard',
      value: 'dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Taker',
      value: 'taker',
      href: '/taker',
      icon: Zap,
    },
    {
      name: 'Giver',
      value: 'giver',
      href: '/giver',
      icon: Share2,
    },
  ]

  const chatActiveId = useMemo(() => {
    if (pathname.startsWith('/chats/')) {
      return pathname.replace('/chats/', '')
    }
    return null
  }, [pathname])

  const handleToggleChats = () => {
    setChatsOpen((prev) => !prev)
  }

  const handleCreateChat = async () => {
    if (creatingChat) {
      return
    }
    setCreatingChat(true)
    try {
      const chat = await createChat()
      if (chat) {
        router.push(`/chats/${chat.id}`)
      }
    } finally {
      setCreatingChat(false)
    }
  }

  const maybeLoadMoreChats = useCallback(async () => {
    if (!chatPagination?.hasMore || loadingMore) {
      return
    }
    setLoadingMore(true)
    try {
      await loadMoreChats()
    } finally {
      setLoadingMore(false)
    }
  }, [chatPagination?.hasMore, loadMoreChats, loadingMore])

  const handleChatsScroll = useCallback(() => {
    const target = chatsScrollRef.current
    if (!target || !chatPagination?.hasMore || loadingMore) {
      return
    }
    const threshold = 48
    if (
      target.scrollHeight - target.scrollTop - target.clientHeight <
      threshold
    ) {
      void maybeLoadMoreChats()
    }
  }, [chatPagination?.hasMore, loadingMore, maybeLoadMoreChats])

  return (
    <div className="flex h-full w-64 flex-col bg-background border-r">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">TunnelMind</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = currentTab === item.value
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}

        <div className="mt-6">
          <button
            type="button"
            onClick={handleToggleChats}
            className="flex w-full items-center justify-between rounded-lg px-3 py-0 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
          >
            <span className="flex items-center gap-2">
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  chatsOpen ? '' : '-rotate-90',
                )}
              />
              Chats
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(event) => {
                event.stopPropagation()
                void handleCreateChat()
              }}
              disabled={creatingChat}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </button>

          {chatsOpen && (
            <div className="mt-2 space-y-2">
              {loading && chats.length === 0 && (
                <p className="px-3 text-xs text-muted-foreground">
                  Loading chats…
                </p>
              )}
              {error && !error.includes('401') && (
                <p className="px-3 text-xs text-destructive">{error}</p>
              )}
              <div
                ref={chatsScrollRef}
                onScroll={handleChatsScroll}
                className="max-h-60 overflow-y-auto pr-1"
              >
                <div className="space-y-1">
                  {chats.map((chat) => {
                    const isActive = chatActiveId === chat.id
                    return (
                      <Link
                        key={chat.id}
                        href={`/chats/${chat.id}`}
                        className={cn(
                          'block rounded-lg px-3 py-2 text-sm transition-colors ml-5',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                      >
                        <div className="truncate font-medium">{chat.title}</div>
                        <div className="text-xs opacity-70">
                          {new Date(chat.updatedAt).toLocaleString()}
                        </div>
                      </Link>
                    )
                  })}
                  {chatPagination?.hasMore && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      {loadingMore
                        ? 'Loading more…'
                        : 'Scroll to load more chats'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="border-t p-4">
        {isAuthenticated && user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-2">
            Not logged in
          </div>
        )}
      </div>
    </div>
  )
}

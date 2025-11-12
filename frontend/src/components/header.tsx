'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, LogIn, Edit2, Check, X, Loader2 } from 'lucide-react'
import { useChat } from '@/lib/hooks/useChat'

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()
  const { currentChat, updateChatTitle } = useChat()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [savingTitle, setSavingTitle] = useState(false)

  useEffect(() => {
    if (currentChat && !editingTitle) {
      setTitleInput(currentChat.title)
    }
  }, [currentChat, editingTitle])

  const handleTitleSave = useCallback(async () => {
    if (!currentChat || !titleInput.trim()) {
      setEditingTitle(false)
      setTitleInput(currentChat?.title || '')
      return
    }
    setSavingTitle(true)
    try {
      await updateChatTitle(currentChat.id, titleInput.trim())
      setEditingTitle(false)
    } finally {
      setSavingTitle(false)
    }
  }, [currentChat, titleInput, updateChatTitle])

  const handleTitleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void handleTitleSave()
    } else if (event.key === 'Escape') {
      setEditingTitle(false)
      setTitleInput(currentChat?.title || '')
    }
  }

  const getPageTitle = () => {
    if (pathname === '/taker') return 'Taker'
    if (pathname === '/giver') return 'Giver'
    if (pathname === '/') return 'Dashboard'
    if (pathname.startsWith('/chats/') && currentChat && currentChat.title)
      return currentChat.title
    return 'TunnelMind'
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {pathname.startsWith('/chats/') && currentChat ? (
            editingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={titleInput}
                  onChange={(event) => setTitleInput(event.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  autoFocus
                  className="w-64"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditingTitle(false)
                    setTitleInput(currentChat.title)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => void handleTitleSave()}
                  disabled={savingTitle}
                >
                  {savingTitle ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{currentChat.title}</h2>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingTitle(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )
          ) : (
            <h2 className="text-lg font-semibold">{getPageTitle()}</h2>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user.name}</span>
              </div>
              <div className="sm:hidden">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/auth')}
            >
              <LogIn className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Login</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

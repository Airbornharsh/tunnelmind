'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button } from '@/components/ui/button'
import { User, LogIn } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()

  const getPageTitle = () => {
    if (pathname === '/taker') return 'Taker'
    if (pathname === '/giver') return 'Giver'
    if (pathname === '/') return 'Dashboard'
    return 'TunnelMind'
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">{getPageTitle()}</h2>
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

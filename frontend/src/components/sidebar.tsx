'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { LayoutDashboard, Zap, Share2, LogOut, User } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button } from '@/components/ui/button'
import { useRouter, usePathname } from 'next/navigation'

export function Sidebar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push('/auth')
  }

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

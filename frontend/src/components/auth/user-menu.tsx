'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button } from '@/components/ui/button'
import { AuthDialog } from './auth-dialog'
import { LogOut, User, Loader2 } from 'lucide-react'

export function UserMenu() {
  const { user, isAuthenticated, logout, checkAuth, loading } = useAuthStore()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleLogout = () => {
    logout()
    window.location.reload()
  }

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </Button>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <Button onClick={() => setAuthDialogOpen(true)} size="sm">
          <User className="h-4 w-4 mr-2" />
          Login
        </Button>
        <AuthDialog
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
          defaultMode="login"
        />
      </>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md text-sm">
        <User className="h-4 w-4" />
        <span className="font-medium">{user.name}</span>
      </div>
      <Button onClick={handleLogout} variant="ghost" size="sm">
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  )
}

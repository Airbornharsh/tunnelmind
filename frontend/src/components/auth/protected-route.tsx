'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
}

export function ProtectedRoute({
  children,
  fallback,
  requireAuth = false,
}: ProtectedRouteProps) {
  const { checkAuth, loading, isAuthenticated } = useAuthStore()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth()
      setChecked(true)
    }
    verifyAuth()
  }, [checkAuth])

  if (loading || !checked) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    )
  }

  if (!requireAuth) {
    return <>{children}</>
  }

  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h2 className="text-2xl font-semibold">Authentication Required</h2>
          <p className="text-muted-foreground">
            Please login to access this feature
          </p>
        </div>
      )
    )
  }

  return <>{children}</>
}

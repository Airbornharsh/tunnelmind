'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { Loader2 } from 'lucide-react'
import { getTerminalToken, setTerminalToken } from '@/utils/session'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const terminalToken = searchParams.get('token')
  const {
    isAuthenticated,
    loading,
    checkAuth,
    authLoaded,
    setAuthLoaded,
    user,
  } = useAuthStore()

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth()
      setAuthLoaded(true)
    }
    verifyAuth()
  }, [checkAuth, setAuthLoaded])

  useEffect(() => {
    if (!authLoaded || loading) return

    if (pathname === '/auth' && isAuthenticated) {
      router.push('/')
      return
    }

    if (!isAuthenticated && pathname !== '/auth') {
      router.push('/auth')
      return
    }
  }, [authLoaded, loading, isAuthenticated, pathname, router])

  const callOnce2 = useRef(false)

  useEffect(() => {
    if (terminalToken) {
      setTerminalToken(terminalToken)
    }

    const terminalTokenData = getTerminalToken()
    if (
      authLoaded &&
      user &&
      terminalTokenData &&
      pathname !== '/terminal' &&
      !callOnce2.current
    ) {
      callOnce2.current = true
      router.push('/terminal')
    }
  }, [terminalToken, router, user, authLoaded, pathname])

  if (!authLoaded || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (pathname === '/auth') {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:border-r">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto px-4 py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

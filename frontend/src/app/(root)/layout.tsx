'use client'

import { Suspense, useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { Loader2 } from 'lucide-react'
import { getTerminalToken, setTerminalToken } from '@/utils/session'
import Link from 'next/link'

function RootLayout({ children }: { children: React.ReactNode }) {
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
    return (
      <div className="relative min-h-screen bg-background">
        {children}
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-10 w-full max-w-2xl -translate-x-1/2 px-4">
          <div className="pointer-events-auto flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card/95 px-5 py-4 text-sm shadow-2xl backdrop-blur-sm sm:flex-row sm:justify-center">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">
              Connect With Harsh
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="https://harshkeshri.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border/50 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/60 hover:bg-primary/10 hover:text-foreground"
              >
                Portfolio
              </Link>
              <Link
                href="https://github.com/airbornharsh"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border/50 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/60 hover:bg-primary/10 hover:text-foreground"
              >
                GitHub
              </Link>
              <Link
                href="https://github.com/airbornharsh/tunnelmind"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border/50 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/60 hover:bg-primary/10 hover:text-foreground"
              >
                Project Repo
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
          <div className="container mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

const RootLayoutSuspense = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RootLayout>{children}</RootLayout>
    </Suspense>
  )
}

export default RootLayoutSuspense

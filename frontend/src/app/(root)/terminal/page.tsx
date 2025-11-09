'use client'

import { useAuthStore } from '@/lib/stores/auth.store'
import { clearTerminalToken, getTerminalToken } from '@/utils/session'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const Page = () => {
  const { authLoaded, user } = useAuthStore()
  const completeTerminalSession = useAuthStore(
    (state) => state.completeTerminalSession,
  )
  const isTerminalSessionLoading = useAuthStore(
    (state) => state.isTerminalSessionLoading,
  )
  const router = useRouter()
  const searchParams = useSearchParams()
  const linked = searchParams.get('linked')
  const callOnce = useRef(false)
  const [declined, setDeclined] = useState(false)

  const hasTerminalToken = getTerminalToken()
  const showPrompt =
    authLoaded && user && hasTerminalToken && !declined && !linked

  useEffect(() => {
    if (authLoaded && !callOnce.current) {
      callOnce.current = true
      if (!user) {
        router.push('/auth')
      }
    }
  }, [authLoaded, user, router])

  useEffect(() => {
    if (linked && user) {
      clearTerminalToken()
    }
  }, [linked, user])

  const handleConnect = async () => {
    setDeclined(false)
    try {
      await completeTerminalSession()
      router.push('/terminal?linked=true')
    } catch (error) {
      console.error('Failed to complete terminal session:', error)
    }
  }

  const handleDecline = () => {
    setDeclined(true)
    clearTerminalToken()
  }

  if (isTerminalSessionLoading) {
    return (
      <div className="bg-background/50 fixed bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-screen items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-foreground text-center text-sm">
          Validating terminal session...
        </p>
      </div>
    )
  }

  if (linked) {
    return (
      <div className="bg-background fixed bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-screen flex-col items-center justify-center gap-2">
        <p className="text-foreground text-center text-sm">
          Linked to terminal
        </p>
        <p className="text-foreground text-center text-sm">
          You can close this window now
        </p>
      </div>
    )
  }

  if (showPrompt && user) {
    return (
      <div className="bg-background/50 fixed bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Terminal Session</CardTitle>
            <CardDescription>
              A terminal session is requesting to connect to your account. Do
              you want to link it?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Connecting will link this terminal session to your account (
              {user.email}).
            </p>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={handleConnect} className="flex-1">
              Connect
            </Button>
            <Button
              onClick={handleDecline}
              variant="outline"
              className="flex-1"
            >
              Decline
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (declined) {
    return (
      <div className="bg-background fixed bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-screen flex-col items-center justify-center gap-2">
        <p className="text-foreground text-center text-sm">
          Terminal session connection declined
        </p>
        <p className="text-foreground text-center text-sm">
          You can close this window now
        </p>
      </div>
    )
  }

  return <div>Page</div>
}

export default Page

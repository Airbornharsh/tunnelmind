'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'
import { useAuthStore } from '@/lib/stores/auth.store'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: 'login' | 'register'
}

export function AuthDialog({
  open,
  onOpenChange,
  defaultMode = 'login',
}: AuthDialogProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      onOpenChange(false)
    }
  }, [isAuthenticated, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'login' ? 'Login to TunnelMind' : 'Create Account'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'login'
              ? 'Enter your credentials to access TunnelMind'
              : 'Create a new account to get started'}
          </DialogDescription>
        </DialogHeader>
        {mode === 'login' ? (
          <LoginForm
            onSuccess={() => onOpenChange(false)}
            onSwitchToRegister={() => setMode('register')}
          />
        ) : (
          <RegisterForm
            onSuccess={() => onOpenChange(false)}
            onSwitchToLogin={() => setMode('login')}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

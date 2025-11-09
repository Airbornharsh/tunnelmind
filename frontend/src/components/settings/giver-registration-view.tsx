'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth.store'
import { api } from '@/lib/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, CheckCircle2, AlertCircle, Share2 } from 'lucide-react'
import { toast } from '@/lib/hooks/useToast'

export function GiverRegistrationView() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [giverName, setGiverName] = useState('')
  const [models, setModels] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRegister = async () => {
    if (!isAuthenticated || !user) {
      router.push('/auth')
      return
    }

    if (!giverName.trim() || !models.trim()) {
      setError('Name and models are required')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const modelList = models
        .split(',')
        .map((m) => m.trim())
        .filter((m) => m.length > 0)

      if (modelList.length === 0) {
        setError('Please provide at least one model')
        setLoading(false)
        return
      }

      const result = await api.registerAsGiver(giverName.trim(), modelList)

      if (result.success) {
        setSuccess(true)
        setGiverName('')
        setModels('')
        toast({
          title: 'Success!',
          description: 'Registered as giver successfully',
        })
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Registration failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Register as Giver</h2>
        <p className="text-muted-foreground">
          Register to share your Ollama models with others
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Giver Registration</CardTitle>
          <CardDescription>
            Register to share your models. You&apos;ll need to run the
            local-server CLI to actually serve requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Successfully registered as giver!</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="giverName" className="text-sm font-medium">
              Giver Name
            </label>
            <Input
              id="giverName"
              value={giverName}
              onChange={(e) => setGiverName(e.target.value)}
              placeholder="My Giver"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="models" className="text-sm font-medium">
              Models (comma-separated)
            </label>
            <Input
              id="models"
              value={models}
              onChange={(e) => setModels(e.target.value)}
              placeholder="llama2, mistral, codellama"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              List the models you want to share, separated by commas
            </p>
          </div>

          <Button
            onClick={handleRegister}
            disabled={loading || !giverName.trim() || !models.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Register as Giver
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

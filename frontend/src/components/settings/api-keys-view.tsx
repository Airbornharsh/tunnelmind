'use client'

import { useState, useEffect } from 'react'
import { useApiKeyStore } from '@/lib/stores/apiKey.store'
import { useAuthStore } from '@/lib/stores/auth.store'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Loader2,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Key,
} from 'lucide-react'
import { toast } from '@/lib/hooks/useToast'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export function ApiKeysView() {
  const router = useRouter()
  const { apiKeys, loading, error, fetchApiKeys, createApiKey, deleteApiKey } =
    useApiKeyStore()
  const { isAuthenticated } = useAuthStore()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchApiKeys()
    } else {
      // router.push('/auth')
    }
  }, [fetchApiKeys, isAuthenticated, router])

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      router.push('/auth')
      return
    }
    setShowCreateDialog(true)
  }

  const handleCreate = async () => {
    if (!newKeyName.trim()) return

    const result = await createApiKey(newKeyName.trim())
    if (result) {
      setNewApiKey(result.apiKey)
      setNewKeyName('')
    }
  }

  const handleCopy = async (id: string) => {
    const result = await api.getApiKey(id)
    if (result.success && result.data?.apiKey && result.data.apiKey.key) {
      navigator.clipboard.writeText(result.data.apiKey.key)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
      toast({
        title: 'Copied!',
        description: 'API key copied to clipboard',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this API key?')) {
      await deleteApiKey(id)
      toast({
        title: 'Deleted',
        description: 'API key deleted successfully',
      })
    }
  }

  return (
    <div className="space-y-6 p-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
          <p className="text-muted-foreground">
            Manage your API keys for programmatic access
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {loading && apiKeys.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : apiKeys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No API keys yet</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              Create your first API key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <Card key={key.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{key.name}</CardTitle>
                    <CardDescription>
                      Created {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsed &&
                        ` • Last used ${new Date(key.lastUsed).toLocaleDateString()}`}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(key.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                    {key.prefix}...
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(key.id)}
                  >
                    {copied === key.id ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for programmatic access
            </DialogDescription>
          </DialogHeader>
          {!newApiKey ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="keyName" className="text-sm font-medium">
                  Key Name
                </label>
                <Input
                  id="keyName"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API Key"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreate()
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!newKeyName.trim()}>
                  Create
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <p className="text-sm font-medium mb-2">
                  ⚠️ Save this API key now
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  You won&apos;t be able to see it again after closing this
                  dialog.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-background border rounded-md text-sm font-mono break-all">
                    {newApiKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(newApiKey)
                      setCopied('new')
                      setTimeout(() => setCopied(null), 2000)
                      toast({
                        title: 'Copied!',
                        description: 'API key copied to clipboard',
                      })
                    }}
                  >
                    {copied === 'new' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setNewApiKey(null)
                    setShowCreateDialog(false)
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

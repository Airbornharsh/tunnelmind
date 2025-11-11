'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle, PlugZap, Terminal } from 'lucide-react'

export function GiverRegistrationView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Share Your Models</h2>
        <p className="text-muted-foreground">
          Registration is automatic. Just run the TunnelMind local server and we
          will handle the rest whenever it connects.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Follow these steps to make your local Ollama models available to
            other users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Terminal className="mt-1 h-4 w-4 text-primary" />
            <p>
              Run <code className="font-mono">tunnelmind login</code> to link
              your CLI with your account, then start the local server with
              <code className="ml-1 font-mono">tunnelmind server</code>.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <PlugZap className="mt-1 h-4 w-4 text-primary" />
            <p>
              The server detects your available Ollama models automatically and
              keeps them in sync with the cloud while the WebSocket connection
              is active.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-1 h-4 w-4 text-primary" />
            <p>
              When the server disconnects, the models are temporarily marked as
              unavailable. Reconnecting the CLI brings them back online
              instantly—no manual registration required.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

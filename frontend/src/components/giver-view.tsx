'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Terminal, Copy, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function GiverView() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Giver Setup</CardTitle>
          <CardDescription>
            Run the local server on your machine to share your GPU and models
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Prerequisites</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Ollama installed and running on your machine</li>
                <li>Node.js 18+ installed</li>
                <li>Models downloaded in Ollama</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Installation</h3>
              <div className="bg-muted p-4 rounded-md font-mono text-sm relative group">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                  onClick={() =>
                    copyToClipboard(
                      'cd local-server && pnpm install && pnpm run build',
                      'install',
                    )
                  }
                >
                  {copied === 'install' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">
                      # Install dependencies and build
                    </span>
                  </div>
                  <div>cd local-server && pnpm install && pnpm run build</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                Running the Local Server
              </h3>
              <div className="bg-muted p-4 rounded-md font-mono text-sm relative group">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                  onClick={() => copyToClipboard('pnpm run dev:local', 'run')}
                >
                  {copied === 'run' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">
                      # Run with default settings
                    </span>
                  </div>
                  <div>pnpm run dev:local</div>
                  <div className="mt-4">
                    <span className="text-muted-foreground">
                      # Or with custom options
                    </span>
                  </div>
                  <div>
                    tunnelmind-local --cloud-url http://localhost:6701 --name
                    "My Giver"
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Configuration</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Create a <code className="bg-muted px-1 rounded">.env</code>{' '}
                file in the local-server directory:
              </p>
              <div className="bg-muted p-4 rounded-md font-mono text-sm relative group">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                  onClick={() =>
                    copyToClipboard(
                      'CLOUD_SERVER_URL=http://localhost:6701\nOLLAMA_URL=http://localhost:11434\nGIVER_NAME=My Giver',
                      'config',
                    )
                  }
                >
                  {copied === 'config' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <div>CLOUD_SERVER_URL=http://localhost:6701</div>
                <div>OLLAMA_URL=http://localhost:11434</div>
                <div>GIVER_NAME=My Giver</div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-2">Status</h3>
              <div className="flex items-center gap-2 text-sm">
                <Terminal className="h-4 w-4" />
                <span>Run the local server to see connection status</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

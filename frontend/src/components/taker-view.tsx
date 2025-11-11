'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useModels } from '@/lib/hooks/useModels'
import { useTunnel } from '@/lib/hooks/useTunnel'
import { useUIStore } from '@/lib/stores/ui.store'
import { Loader2, Send, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export function TakerView() {
  const { availableModels, error: modelsError } = useModels()
  const {
    error: tunnelError,
    response,
    loading: inferenceLoading,
    sendMessage,
  } = useTunnel()

  const {
    selectedModel,
    apiKey,
    prompt,
    setSelectedModel,
    setApiKey,
    setPrompt,
  } = useUIStore()

  const selectedModelData = availableModels.find(
    (m) => m.model === selectedModel,
  )

  const error = modelsError || tunnelError
  const canSendPrompt = Boolean(selectedModel && selectedModel.length > 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Available Models</CardTitle>
          <CardDescription>
            Select a model to connect and use it for inference
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">API Key (Optional)</label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Model</label>
            <Select
              value={selectedModel}
              onValueChange={setSelectedModel}
              disabled={inferenceLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((modelData) => (
                  <SelectItem key={modelData.model} value={modelData.model}>
                    <div className="flex items-center gap-2">
                      <span>{modelData.model}</span>
                      <span className="text-xs text-muted-foreground">
                        ({modelData.givers.length} giver
                        {modelData.givers.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedModelData && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Available Givers</label>
              <div className="flex flex-wrap gap-2">
                {selectedModelData.givers.map((giver) => (
                  <div
                    key={giver.id}
                    className="flex items-center gap-2 px-2 py-1 bg-secondary rounded-md text-sm"
                  >
                    {giver.status === 'online' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-500" />
                    )}
                    <span>{giver.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Select a model and provide an API key (optional). Prompts are sent
            on demand without maintaining a persistent connection.
          </p>
        </CardContent>
      </Card>

      {canSendPrompt && (
        <Card>
          <CardHeader>
            <CardTitle>Inference Request</CardTitle>
            <CardDescription>
              Send prompts to the connected model
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Input value={selectedModel} disabled />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                rows={4}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
              />
            </div>

            <Button
              onClick={sendMessage}
              disabled={!prompt || !selectedModel || inferenceLoading}
              className="w-full"
            >
              {inferenceLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Request
                </>
              )}
            </Button>

            {response && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Response</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(response)
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <div className="p-4 bg-muted rounded-md min-h-[200px] max-h-[600px] overflow-y-auto whitespace-pre-wrap">
                  {response}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

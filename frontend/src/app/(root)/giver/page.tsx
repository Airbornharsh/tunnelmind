'use client'

import { useEffect } from 'react'
import { useModelsStore } from '@/lib/stores/models.store'
import { GiverView } from '@/components/giver-view'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function GiverPage() {
  const { availableModels, loading, error, fetchModels } = useModelsStore()

  useEffect(() => {
    fetchModels()
    const interval = setInterval(() => {
      fetchModels()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchModels])

  return (
    <div className="space-y-6 p-4">
      {/* Available Models List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Models</CardTitle>
          <CardDescription>
            Models currently available from online givers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && availableModels.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error.includes('401') ? 'Login to continue' : error}</span>
            </div>
          ) : availableModels.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No models available at the moment</p>
              <p className="text-sm mt-2">Start a giver to share your models</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableModels.map((model) => (
                <div
                  key={model.model}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{model.model}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Available from {model.givers.length} giver
                      {model.givers.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {model.givers.map((giver) => (
                        <span
                          key={giver.id}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded-md"
                        >
                          <CheckCircle2
                            className={`h-3 w-3 ${
                              giver.status === 'online'
                                ? 'text-green-500'
                                : 'text-gray-400'
                            }`}
                          />
                          {giver.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Installation Documentation */}
      <GiverView />
    </div>
  )
}

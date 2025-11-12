import { Response } from 'express'
import { randomUUID } from 'crypto'
import { AuthenticatedRequest, ApiResponse } from '../types'
import { GiverService } from '../services/giver.service'
import { webSocketManager } from '../websocket/WebSocketManager'

export class TakerController {
  static async getAvailableModels(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
      return
    }

    const result = await GiverService.getAvailableModels()

    res.status(200).json({
      success: true,
      data: result,
    })
  }

  static async createChatCompletion(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            message: 'Unauthorized',
            type: 'authentication_error',
          },
        })
        return
      }

      const {
        model,
        messages,
        prompt,
        stream,
        temperature,
        max_tokens,
        top_p,
        frequency_penalty,
        presence_penalty,
      } = req.body || {}

      const trimmedModel =
        typeof model === 'string' ? model.trim() : (model as string)

      if (!trimmedModel) {
        res.status(400).json({
          error: {
            message: 'Model is required',
            type: 'invalid_request_error',
          },
        })
        return
      }

      const requestPayload = req.body || {}

      const hasPromptInput = (() => {
        if (typeof prompt === 'string' && prompt.trim().length > 0) {
          return true
        }
        if (
          typeof requestPayload.prompt === 'string' &&
          requestPayload.prompt.trim().length > 0
        ) {
          return true
        }
        if (
          typeof requestPayload.input === 'string' &&
          requestPayload.input.trim().length > 0
        ) {
          return true
        }
        if (
          Array.isArray(requestPayload.messages) &&
          requestPayload.messages.length > 0
        ) {
          return true
        }
        return false
      })()

      if (!hasPromptInput) {
        res.status(400).json({
          error: {
            message:
              'Either prompt or messages must be provided in the request body.',
            type: 'invalid_request_error',
          },
        })
        return
      }

      const completionId = `chatcmpl-${randomUUID()}`
      const created = Math.floor(Date.now() / 1000)

      if (stream === true) {
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache, no-transform')
        res.setHeader('Connection', 'keep-alive')
        ;(res as any).flushHeaders?.()

        let firstChunk = true
        let streamClosed = false

        const sendChunk = (chunk: string) => {
          const payload = {
            id: completionId,
            object: 'chat.completion.chunk',
            created,
            model: trimmedModel,
            choices: [
              {
                index: 0,
                delta: firstChunk
                  ? {
                      role: 'assistant',
                      content: chunk,
                    }
                  : {
                      content: chunk,
                    },
                finish_reason: null,
              },
            ],
          }
          firstChunk = false
          res.write(`data: ${JSON.stringify(payload)}\n\n`)
        }

        const sendDone = () => {
          const finalPayload = {
            id: completionId,
            object: 'chat.completion.chunk',
            created,
            model: trimmedModel,
            choices: [
              {
                index: 0,
                delta: {},
                finish_reason: 'stop',
              },
            ],
          }
          res.write(`data: ${JSON.stringify(finalPayload)}\n\n`)
          res.write('data: [DONE]\n\n')
          res.end()
          streamClosed = true
        }

        const sendError = (errorMessage: string) => {
          const errorPayload = {
            error: {
              message: errorMessage,
              type: 'server_error',
            },
          }
          res.write(`data: ${JSON.stringify(errorPayload)}\n\n`)
          res.write('data: [DONE]\n\n')
          res.end()
          streamClosed = true
        }

        req.on('close', () => {
          if (!streamClosed) {
            streamClosed = true
          }
        })

        try {
          await webSocketManager.requestInference(
            trimmedModel,
            {
              userId: req.user.userId,
              openai: {
                ...requestPayload,
                stream: true,
              },
            },
            60_000,
            {
              onChunk: (chunk) => {
                if (streamClosed || !chunk) {
                  return
                }
                sendChunk(chunk)
              },
            },
          )
          if (!streamClosed) {
            sendDone()
          }
        } catch (error: any) {
          if (!streamClosed) {
            sendError(error?.message || 'Failed to process inference request')
          }
        }
        return
      }

      const result = await webSocketManager.requestInference(trimmedModel, {
        userId: req.user.userId,
        openai: requestPayload,
      })

      res.status(200).json({
        id: completionId,
        object: 'chat.completion',
        created,
        model: trimmedModel,
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: result.response,
            },
            finish_reason: 'stop',
          },
        ],
      })
    } catch (error: any) {
      res.status(503).json({
        error: {
          message: error?.message || 'Failed to process inference request',
          type: 'server_error',
        },
      })
    }
  }
}

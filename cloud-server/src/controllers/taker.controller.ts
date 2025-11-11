import { Response } from 'express'
import { randomUUID } from 'crypto'
import { AuthenticatedRequest, ApiResponse } from '../types'
import { GiverService } from '../services/giver.service'
import { webSocketManager } from '../websocket/WebSocketManager'

type OpenAIMessage = {
  role: string
  content:
    | string
    | null
    | Array<{ type: string; text?: string | null; [key: string]: unknown }>
  [key: string]: unknown
}

function getLastUserMessage(messages: OpenAIMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]
    if (message.role && message.role !== 'assistant') {
      if (typeof message.content === 'string') {
        return message.content.trim() || null
      }
      if (Array.isArray(message.content)) {
        const text = message.content
          .map((segment) =>
            typeof segment?.text === 'string' ? segment.text : '',
          )
          .filter((segment) => segment && segment.trim().length > 0)
          .join('\n')
        return text.trim() || null
      }
    }
  }
  return null
}

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

  static async requestInference(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        })
        return
      }

      const { model, prompt, options } = req.body || {}

      const trimmedModel =
        typeof model === 'string' ? model.trim() : (model as string)

      if (!trimmedModel) {
        res.status(400).json({
          success: false,
          error: 'Model is required',
        })
        return
      }

      const trimmedPrompt =
        typeof prompt === 'string' ? prompt.trim() : (prompt as string)

      if (!trimmedPrompt) {
        res.status(400).json({
          success: false,
          error: 'Prompt is required',
        })
        return
      }

      const result = await webSocketManager.requestInference(trimmedModel, {
        prompt: trimmedPrompt,
        options,
        userId: req.user.userId,
      })

      res.status(200).json({
        success: true,
        data: {
          model: trimmedModel,
          response: result.response,
          chunks: result.chunks,
          giverId: result.giverId,
        },
      })
    } catch (error: any) {
      res.status(503).json({
        success: false,
        error: error?.message || 'Failed to process inference request',
      })
    }
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

      if (stream === true) {
        res.status(400).json({
          error: {
            message: 'Streaming responses are not supported.',
            type: 'invalid_request_error',
          },
        })
        return
      }

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

      const chatMessages: OpenAIMessage[] = Array.isArray(messages)
        ? (messages as OpenAIMessage[])
        : []

      const promptText = (() => {
        const explicitPrompt =
          typeof prompt === 'string' ? prompt.trim() : (prompt as string)
        if (explicitPrompt && explicitPrompt.trim().length > 0) {
          return explicitPrompt.trim()
        }
        const lastUserMessage =
          chatMessages.length > 0 ? getLastUserMessage(chatMessages) : null
        return lastUserMessage || ''
      })()

      if (!promptText) {
        res.status(400).json({
          error: {
            message:
              'Either prompt or messages containing a user message are required.',
            type: 'invalid_request_error',
          },
        })
        return
      }

      const result = await webSocketManager.requestInference(trimmedModel, {
        prompt: promptText,
        options: {
          temperature,
          max_tokens,
          top_p,
          frequency_penalty,
          presence_penalty,
        },
        userId: req.user.userId,
        openai:
          chatMessages.length > 0
            ? {
                type: 'chat',
                messages: chatMessages,
                temperature,
                top_p,
                max_tokens,
                frequency_penalty,
                presence_penalty,
              }
            : undefined,
      })

      const completionId = `chatcmpl-${randomUUID()}`
      const created = Math.floor(Date.now() / 1000)

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

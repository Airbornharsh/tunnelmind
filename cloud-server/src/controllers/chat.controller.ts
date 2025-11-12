import { Response } from 'express'
import { AuthenticatedRequest, ApiResponse } from '../types'
import { ChatService } from '../services/chat.service'
import { webSocketManager } from '../websocket/WebSocketManager'

export class ChatController {
  static async listChats(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' })
      return
    }

    const pageParam = Array.isArray(req.query.page)
      ? req.query.page[0]
      : req.query.page
    const limitParam = Array.isArray(req.query.limit)
      ? req.query.limit[0]
      : req.query.limit
    const page = Number(pageParam) || 1
    const limit = Number(limitParam) || 20

    const result = await ChatService.listChats(req.user.userId, page, limit)
    res.status(200).json({
      success: true,
      data: {
        chats: result.items,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
          hasMore: result.hasMore,
        },
      },
    })
  }

  static async createChat(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' })
      return
    }

    const { title } = req.body || {}
    const chat = await ChatService.createChat(req.user.userId, title)

    if (!chat) {
      res.status(500).json({ success: false, error: 'Failed to create chat' })
      return
    }

    res.status(201).json({ success: true, data: { chat } })
  }

  static async updateChatTitle(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' })
      return
    }

    const { id } = req.params
    const { title } = req.body || {}

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Title is required' })
      return
    }

    const chat = await ChatService.updateChatTitle(id, req.user.userId, title)

    if (!chat) {
      res.status(404).json({ success: false, error: 'Chat not found' })
      return
    }

    res.status(200).json({ success: true, data: { chat } })
  }

  static async getChat(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' })
      return
    }

    const { id } = req.params

    const pageParam = Array.isArray(req.query.page)
      ? req.query.page[0]
      : req.query.page
    const limitParam = Array.isArray(req.query.limit)
      ? req.query.limit[0]
      : req.query.limit
    const page = Number(pageParam) || 1
    const limit = Number(limitParam) || 50

    const result = await ChatService.getChatWithMessages(
      id,
      req.user.userId,
      page,
      limit,
    )
    if (!result) {
      res.status(404).json({ success: false, error: 'Chat not found' })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        chat: result.chat,
        messages: result.messages,
        pagination: {
          page: result.pagination.page,
          pageSize: result.pagination.pageSize,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages,
          hasMore: result.pagination.hasMore,
        },
      },
    })
  }

  static async sendMessage(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' })
      return
    }

    const { id } = req.params
    const { content, model } = req.body || {}

    if (
      !content ||
      typeof content !== 'string' ||
      content.trim().length === 0
    ) {
      res.status(400).json({
        success: false,
        error: 'Message content is required',
      })
      return
    }

    if (!model || typeof model !== 'string' || model.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Model is required',
      })
      return
    }

    const chat = await ChatService.getChat(id, req.user.userId)
    if (!chat) {
      res.status(404).json({ success: false, error: 'Chat not found' })
      return
    }

    const existingMessages =
      (await ChatService.getAllMessages(id, req.user.userId)) || []

    const trimmedContent = content.trim()

    const userMessage = await ChatService.addMessage(
      id,
      req.user.userId,
      'user',
      trimmedContent,
    )

    if (!userMessage) {
      res.status(500).json({ success: false, error: 'Failed to save message' })
      return
    }

    const conversationMessages = [...existingMessages, userMessage].map(
      (message) => ({
        role: message.role,
        content: message.content,
      }),
    )

    const streamParam = Array.isArray(req.query.stream)
      ? req.query.stream[0]
      : req.query.stream
    const shouldStream =
      streamParam === 'true' ||
      streamParam === '1' ||
      req.body?.stream === true ||
      req.headers.accept === 'text/event-stream'

    if (shouldStream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')
      ;(res as any).flushHeaders?.()

      const writeEvent = (payload: unknown) => {
        res.write(`data: ${JSON.stringify(payload)}\n\n`)
      }

      let streamClosed = false
      req.on('close', () => {
        streamClosed = true
      })

      writeEvent({ type: 'user', chat, userMessage })

      let aggregatedChunks = ''

      try {
        const inferenceResult = await webSocketManager.requestInference(
          model.trim(),
          {
            userId: req.user.userId,
            openai: {
              messages: conversationMessages,
              stream: true,
            },
          },
          60_000,
          {
            onChunk: (chunk) => {
              if (!chunk || streamClosed) {
                return
              }
              aggregatedChunks += chunk
              writeEvent({ type: 'chunk', chatId: chat.id, chunk })
            },
          },
        )

        const assistantContent =
          aggregatedChunks.length > 0
            ? aggregatedChunks
            : inferenceResult.response

        const assistantMessage = await ChatService.addMessage(
          id,
          req.user.userId,
          'assistant',
          assistantContent,
          {
            chunks: inferenceResult.chunks,
          },
        )

        if (!streamClosed && assistantMessage) {
          writeEvent({ type: 'assistant', chat, assistantMessage })
        }
      } catch (error: any) {
        if (!streamClosed) {
          writeEvent({
            type: 'error',
            error: error?.message || 'Failed to generate response',
          })
        }
      } finally {
        if (!streamClosed) {
          res.write('data: [DONE]\n\n')
          res.end()
        }
      }
      return
    }

    try {
      const inferenceResult = await webSocketManager.requestInference(
        model.trim(),
        {
          userId: req.user.userId,
          openai: {
            messages: conversationMessages,
          },
        },
      )

      const assistantMessage = await ChatService.addMessage(
        id,
        req.user.userId,
        'assistant',
        inferenceResult.response,
        {
          chunks: inferenceResult.chunks,
        },
      )

      res.status(200).json({
        success: true,
        data: {
          chat,
          userMessage,
          assistantMessage,
        },
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message || 'Failed to generate response',
      })
    }
  }
}

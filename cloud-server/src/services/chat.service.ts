import { db } from '../db/mongo/init'
import { Chat, ChatMessage } from '../types'

interface PaginationResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasMore: boolean
}

function buildPagination<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginationResult<T> {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const hasMore = currentPage * pageSize < total

  return {
    items,
    total,
    page: currentPage,
    pageSize,
    totalPages,
    hasMore,
  }
}

function mapChat(doc: any): Chat {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    title: doc.title,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

function mapMessage(doc: any): ChatMessage {
  return {
    id: doc._id.toString(),
    chatId: doc.chatId.toString(),
    userId: doc.userId.toString(),
    role: doc.role,
    content: doc.content,
    metadata: doc.metadata || undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export class ChatService {
  static async listChats(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginationResult<Chat>> {
    try {
      if (!db?.ChatModel) {
        throw new Error('Database not initialized')
      }
      const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100)
      const requestedPage = Math.max(Number(page) || 1, 1)
      const total = await db.ChatModel.countDocuments({ userId })
      const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
      const currentPage = Math.min(requestedPage, totalPages)
      const skip = (currentPage - 1) * pageSize

      const chats = await db.ChatModel.find({ userId })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec()

      const mapped = chats.map(mapChat)
      return buildPagination(mapped, total, currentPage, pageSize)
    } catch (error) {
      return buildPagination([], 0, 1, limit || 20)
    }
  }

  static async createChat(
    userId: string,
    title?: string,
  ): Promise<Chat | null> {
    try {
      if (!db?.ChatModel) {
        throw new Error('Database not initialized')
      }
      const normalizedTitle =
        typeof title === 'string' && title.trim().length > 0
          ? title.trim()
          : 'New Chat'

      const chat = await db.ChatModel.create({
        userId,
        title: normalizedTitle,
      })

      return chat ? mapChat(chat) : null
    } catch (error) {
      return null
    }
  }

  static async getChat(chatId: string, userId: string): Promise<Chat | null> {
    try {
      if (!db?.ChatModel) {
        throw new Error('Database not initialized')
      }
      const chat = await db.ChatModel.findOne({ _id: chatId, userId })
      return chat ? mapChat(chat) : null
    } catch (error) {
      return null
    }
  }

  static async updateChatTitle(
    chatId: string,
    userId: string,
    title: string,
  ): Promise<Chat | null> {
    try {
      if (!db?.ChatModel) {
        throw new Error('Database not initialized')
      }

      const normalizedTitle = title.trim()
      if (!normalizedTitle) {
        throw new Error('Title is required')
      }

      const chat = await db.ChatModel.findOneAndUpdate(
        { _id: chatId, userId },
        { $set: { title: normalizedTitle } },
        { new: true },
      )

      return chat ? mapChat(chat) : null
    } catch (error) {
      return null
    }
  }

  static async getChatWithMessages(
    chatId: string,
    userId: string,
    page = 1,
    limit = 50,
  ): Promise<{
    chat: Chat
    messages: ChatMessage[]
    pagination: PaginationResult<ChatMessage>
  } | null> {
    try {
      if (!db?.ChatModel || !db?.ChatMessageModel) {
        throw new Error('Database not initialized')
      }
      const chat = await db.ChatModel.findOne({ _id: chatId, userId })
      if (!chat) {
        return null
      }

      const pageSize = Math.min(Math.max(Number(limit) || 50, 1), 200)
      const requestedPage = Math.max(Number(page) || 1, 1)
      const total = await db.ChatMessageModel.countDocuments({ chatId })
      const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
      const currentPage = Math.min(requestedPage, totalPages)
      const skip = (currentPage - 1) * pageSize

      const messages = await db.ChatMessageModel.find({ chatId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec()

      const mappedMessages = messages.map(mapMessage).reverse()

      return {
        chat: mapChat(chat),
        messages: mappedMessages,
        pagination: buildPagination(
          mappedMessages,
          total,
          currentPage,
          pageSize,
        ),
      }
    } catch (error) {
      return null
    }
  }

  static async addMessage(
    chatId: string,
    userId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<ChatMessage | null> {
    try {
      if (!db?.ChatMessageModel || !db?.ChatModel) {
        throw new Error('Database not initialized')
      }
      const message = await db.ChatMessageModel.create({
        chatId,
        userId,
        role,
        content,
        metadata: metadata || null,
      })

      await db.ChatModel.updateOne(
        { _id: chatId },
        { $set: { updatedAt: message.createdAt } },
      )

      return message ? mapMessage(message) : null
    } catch (error) {
      return null
    }
  }

  static async getAllMessages(
    chatId: string,
    userId: string,
  ): Promise<ChatMessage[] | null> {
    try {
      if (!db?.ChatModel || !db?.ChatMessageModel) {
        throw new Error('Database not initialized')
      }

      const chat = await db.ChatModel.findOne({ _id: chatId, userId })
      if (!chat) {
        return null
      }

      const messages = await db.ChatMessageModel.find({ chatId })
        .sort({ createdAt: 1 })
        .exec()

      return messages.map(mapMessage)
    } catch (error) {
      return null
    }
  }
}

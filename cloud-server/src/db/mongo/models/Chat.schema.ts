import mongoose from 'mongoose'

export interface IChat extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  title: string
  createdAt: Date
  updatedAt: Date
}

export interface IChatMessage extends mongoose.Document {
  chatId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  role: 'user' | 'assistant'
  content: string
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const ChatSchema = new mongoose.Schema<IChat>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

const ChatMessageSchema = new mongoose.Schema<IChatMessage>(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

ChatMessageSchema.index({ chatId: 1, createdAt: 1 })

export { ChatSchema, ChatMessageSchema }

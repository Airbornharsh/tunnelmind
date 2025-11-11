import mongoose from 'mongoose'

export interface IApiKey extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  name: string
  keyHash: string
  encryptedKey: string
  prefix: string
  lastUsed?: Date
  createdAt: Date
  updatedAt: Date
}

const ApiKeySchema = new mongoose.Schema<IApiKey>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    keyHash: {
      type: String,
      required: true,
      select: false,
    },
    encryptedKey: {
      type: String,
      required: true,
      select: false,
    },
    prefix: {
      type: String,
      required: true,
      length: 8,
    },
    lastUsed: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

export default ApiKeySchema

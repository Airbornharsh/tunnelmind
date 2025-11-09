import mongoose from 'mongoose'
import crypto from 'crypto'

export interface IApiKey extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  name: string
  key: string
  prefix: string
  lastUsed?: Date
  createdAt: Date
  updatedAt: Date
  generateKey(): string
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
    key: {
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

ApiKeySchema.pre(
  'save',
  async function (next: mongoose.CallbackWithoutResultAndOptionalError) {
    if (!this.isModified('key') || !this.isNew) return next()

    const rawKey = crypto.randomBytes(32).toString('hex')
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex')

    this.key = hashedKey
    this.prefix = rawKey.substring(0, 8)
    ;(this as any)._rawKey = rawKey

    next()
  },
)

ApiKeySchema.methods.getRawKey = function (): string | null {
  return (this as any)._rawKey || null
}

ApiKeySchema.statics.verifyKey = async function (
  key: string,
): Promise<IApiKey | null> {
  const hashedKey = crypto.createHash('sha256').update(key).digest('hex')
  const apiKey = await this.findOne({ key: hashedKey })
  if (apiKey) {
    apiKey.lastUsed = new Date()
    await apiKey.save()
  }
  return apiKey
}

export default ApiKeySchema

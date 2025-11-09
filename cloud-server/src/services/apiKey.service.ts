import crypto from 'crypto'
import { db } from '../db/mongo/init'

export interface ApiKeyInfo {
  id: string
  name: string
  prefix: string
  lastUsed?: Date
  createdAt: Date
}

export class ApiKeyService {
  static async createApiKey(
    userId: string,
    name: string,
  ): Promise<{ apiKey: string; info: ApiKeyInfo } | null> {
    try {
      const rawKey = crypto.randomBytes(32).toString('hex')
      const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex')
      const prefix = rawKey.substring(0, 8)

      const apiKeyDoc = await db.ApiKeyModel.create({
        userId,
        name,
        key: hashedKey,
        prefix,
      })

      if (!apiKeyDoc || !apiKeyDoc._id) {
        throw new Error('Failed to create API key')
      }

      return {
        apiKey: rawKey,
        info: {
          id: apiKeyDoc._id.toString(),
          name: apiKeyDoc.name,
          prefix: apiKeyDoc.prefix,
          lastUsed: apiKeyDoc.lastUsed,
          createdAt: apiKeyDoc.createdAt,
        },
      }
    } catch (error: any) {
      return null
    }
  }

  static async getApiKeys(userId: string): Promise<ApiKeyInfo[]> {
    try {
      const apiKeys = await db.ApiKeyModel.find({ userId })
        .select('-key')
        .sort({ createdAt: -1 })

      const keys = (apiKeys || [])
        .map((key) =>
          key && key._id
            ? {
                id: key._id.toString(),
                name: key.name,
                prefix: key.prefix,
                lastUsed: key.lastUsed || undefined,
                createdAt: key.createdAt,
              }
            : null,
        )
        .filter((key) => key !== null)

      return keys
    } catch (error: any) {
      return []
    }
  }

  static async deleteApiKey(
    userId: string,
    apiKeyId: string,
  ): Promise<boolean> {
    try {
      const apiKey = await db.ApiKeyModel.findOne({
        _id: apiKeyId,
        userId,
      })

      if (!apiKey) {
        return false
      }

      await db.ApiKeyModel.deleteOne({ _id: apiKeyId, userId })

      return true
    } catch (error: any) {
      return false
    }
  }

  static async verifyApiKey(key: string): Promise<{ userId: string } | null> {
    try {
      const hashedKey = crypto.createHash('sha256').update(key).digest('hex')
      const apiKey = await db.ApiKeyModel.findOne({ key: hashedKey })

      if (!apiKey) {
        return null
      }

      apiKey.lastUsed = new Date()
      await apiKey.save()

      return {
        userId: apiKey.userId.toString(),
      }
    } catch (error: any) {
      return null
    }
  }
}

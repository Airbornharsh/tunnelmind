import crypto from 'crypto'
import { db } from '../db/mongo/init'
import {
  API_KEY_ENCRYPTION_KEY,
  API_KEY_ENCRYPTION_SECRET,
} from '../config/config'

export interface ApiKeyInfo {
  id: string
  name: string
  prefix: string
  lastUsed?: Date
  createdAt: Date
}

export class ApiKeyService {
  private static encryptionKey: Buffer | null = null

  private static getEncryptionKey(): Buffer {
    if (this.encryptionKey) {
      return this.encryptionKey
    }

    const secret = API_KEY_ENCRYPTION_KEY || API_KEY_ENCRYPTION_SECRET

    if (!secret) {
      throw new Error(
        'API_KEY_ENCRYPTION_KEY (32-byte hex/base64/utf8) must be set in the environment to manage API keys.',
      )
    }

    let keyBuffer: Buffer | null = null

    if (/^[0-9a-fA-F]{64}$/.test(secret)) {
      keyBuffer = Buffer.from(secret, 'hex')
    } else {
      try {
        keyBuffer = Buffer.from(secret, 'base64')
      } catch (error) {
        keyBuffer = null
      }

      if (!keyBuffer || keyBuffer.length !== 32) {
        keyBuffer = Buffer.from(secret, 'utf8')
      }
    }

    if (keyBuffer.length !== 32) {
      throw new Error(
        'API_KEY_ENCRYPTION_KEY must resolve to 32 bytes (256 bits).',
      )
    }

    this.encryptionKey = keyBuffer
    return this.encryptionKey
  }

  private static encryptKey(rawKey: string): string {
    const key = this.getEncryptionKey()
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    const encrypted = Buffer.concat([
      cipher.update(rawKey, 'utf8'),
      cipher.final(),
    ])
    const authTag = cipher.getAuthTag()

    return [
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted.toString('hex'),
    ].join(':')
  }

  private static decryptKey(encryptedKey: string): string {
    const [ivHex, tagHex, dataHex] = encryptedKey.split(':')
    if (!ivHex || !tagHex || !dataHex) {
      throw new Error('Invalid encrypted API key format')
    }

    const key = this.getEncryptionKey()
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(ivHex, 'hex'),
    )
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ])

    return decrypted.toString('utf8')
  }

  static async createApiKey(
    userId: string,
    name: string,
  ): Promise<{ apiKey: string; info: ApiKeyInfo } | null> {
    try {
      const rawKey = crypto.randomBytes(32).toString('hex')
      const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex')
      const prefix = rawKey.substring(0, 8)

      const encryptedKey = this.encryptKey(rawKey)

      const apiKeyDoc = await db.ApiKeyModel.create({
        userId,
        name,
        keyHash: hashedKey,
        encryptedKey,
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
      console.error(error)
      return null
    }
  }

  static async getApiKeys(userId: string): Promise<ApiKeyInfo[]> {
    try {
      const apiKeys = await db.ApiKeyModel.find({ userId }).sort({
        createdAt: -1,
      })

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

  static async getApiKey(
    userId: string,
    apiKeyId: string,
  ): Promise<(ApiKeyInfo & { key: string }) | null> {
    try {
      const apiKey = await db.ApiKeyModel.findOne({
        _id: apiKeyId,
        userId,
      }).select('+encryptedKey')

      if (!apiKey || !apiKey._id) {
        return null
      }

      const decryptedKey = this.decryptKey(apiKey.encryptedKey)

      return {
        id: apiKey._id.toString(),
        name: apiKey.name,
        prefix: apiKey.prefix,
        key: decryptedKey,
        lastUsed: apiKey.lastUsed || undefined,
        createdAt: apiKey.createdAt,
      }
    } catch (error: any) {
      return null
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

  static async verifyApiKey(
    key: string,
  ): Promise<{ userId: string; email: string } | null> {
    try {
      const hashedKey = crypto.createHash('sha256').update(key).digest('hex')
      const apiKey = await db.ApiKeyModel.findOne({ keyHash: hashedKey })

      if (!apiKey) {
        return null
      }

      apiKey.lastUsed = new Date()
      await apiKey.save()

      const user = await db.UserModel.findById(apiKey.userId)
      const email = user?.email || ''

      return {
        userId: apiKey.userId.toString(),
        email,
      }
    } catch (error: any) {
      return null
    }
  }
}

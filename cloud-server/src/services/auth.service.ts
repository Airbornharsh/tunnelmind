import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { JWT_SECRET } from '../config/config'
import { db } from '../db/mongo/init'
import { JWTPayload, LoginRequest, RegisterRequest } from '../types'

export class AuthService {
  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '7d',
    })
  }

  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      return null
    }
  }

  static async register(
    data: RegisterRequest,
  ): Promise<{ user: any; token: string; apiKey?: string } | null> {
    try {
      const existingUser = await db.UserModel.findOne({ email: data.email })
      if (existingUser) {
        return null
      }

      const user = await db.UserModel.create({
        email: data.email,
        password: data.password,
        name: data.name,
      })

      if (!user || !user._id) {
        throw new Error('Failed to create user')
      }

      const token = this.generateToken({
        userId: user._id.toString(),
        email: user.email,
        type: 'user',
      })

      let apiKey: string | null = null
      try {
        const rawKey = crypto.randomBytes(32).toString('hex')
        const hashedKey = crypto
          .createHash('sha256')
          .update(rawKey)
          .digest('hex')
        const prefix = rawKey.substring(0, 8)

        await db.ApiKeyModel.create({
          userId: user._id,
          name: 'Default API Key',
          key: hashedKey,
          prefix,
        })

        apiKey = rawKey
      } catch (error) {}

      return {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
        token,
        apiKey: apiKey || undefined,
      }
    } catch (error: any) {
      return null
    }
  }

  static async login(
    data: LoginRequest,
  ): Promise<{ user: any; token: string } | null> {
    try {
      const user = await db.UserModel.findOne({ email: data.email }).select(
        '+password',
      )

      if (!user || !user._id) {
        return null
      }

      const isPasswordValid = await user.comparePassword(data.password)
      if (!isPasswordValid) {
        return null
      }

      const token = this.generateToken({
        userId: user._id.toString(),
        email: user.email,
        type: 'user',
      })

      return {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
        token,
      }
    } catch (error: any) {
      return null
    }
  }
}

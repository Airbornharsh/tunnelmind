import { Response, NextFunction, Request } from 'express'
import { AuthenticatedRequest, ApiResponse } from '../types'
import { AuthService } from '../services/auth.service'
import { ApiKeyService } from '../services/apiKey.service'
import { db } from '../db/mongo/init'

async function attachUser(req: Request, userId: string): Promise<boolean> {
  const user = await db.UserModel.findById(userId)
  if (!user || !user._id) {
    return false
  }

  ;(req as AuthenticatedRequest).user = {
    _id: user._id.toString(),
    id: user._id.toString(),
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }

  return true
}

export class AuthMiddleware {
  static async authMiddleware(
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction,
  ) {
    try {
      // Prefer Bearer token authentication when available.
      const authHeader = req.headers.authorization
      if (authHeader && typeof authHeader === 'string') {
        const [scheme, token] = authHeader.split(' ')
        if (scheme?.toLowerCase() === 'bearer' && token) {
          const decodedToken = AuthService.verifyToken(token)
          if (decodedToken?.userId) {
            const attached = await attachUser(req, decodedToken.userId)
            if (attached) {
              next()
              return
            }
          }
        }
      }

      const apiKeyHeader = req.headers['x-api-key'] || null

      if (apiKeyHeader && typeof apiKeyHeader === 'string') {
        const apiKeyVerification =
          await ApiKeyService.verifyApiKey(apiKeyHeader)
        if (apiKeyVerification) {
          const attached = await attachUser(req, apiKeyVerification.userId)
          if (attached) {
            next()
            return
          }
        }
      }

      res.status(401).json({
        success: false,
        error: 'Authentication failed',
      })
      return
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Authentication failed',
      })
      return
    }
  }
}

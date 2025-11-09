import { Response, NextFunction, Request } from 'express'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/config'
import { AuthenticatedRequest, JWTPayload, ApiResponse } from '../types'
import { db } from '../db/mongo/init'
import { AuthService } from '../services/auth.service'

export class AuthMiddleware {
  static async authMiddleware(
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction,
  ) {
    try {
      const splitted = req.headers.authorization?.split(' ')
      if (!splitted) {
        res.status(401).json({
          success: false,
          error: 'No authorization token provided',
        })
        return
      }

      const token = splitted[1]
      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No authorization token provided',
        })
        return
      }

      const decodedToken = AuthService.verifyToken(token)

      if (decodedToken?.email && decodedToken.userId) {
        ;(req as AuthenticatedRequest).user = {
          email: decodedToken.email,
          userId: decodedToken.userId,
          type: decodedToken.type,
          sessionId: decodedToken.sessionId,
        }
        next()
        return
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

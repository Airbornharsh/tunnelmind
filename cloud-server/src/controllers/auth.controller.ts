import { Response } from 'express'
import {
  AuthenticatedRequest,
  ApiResponse,
  LoginRequest,
  RegisterRequest,
} from '../types'
import { AuthService } from '../services/auth.service'
import { v4 } from 'uuid'
import { db } from '../db/mongo/init'
import { IUser } from '../db/mongo/models/User.schema'

export class AuthController {
  static async register(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
  ): Promise<void> {
    const data: RegisterRequest = req.body

    if (
      !data.email ||
      typeof data.email !== 'string' ||
      data.email.trim().length === 0
    ) {
      res.status(400).json({
        success: false,
        error: 'Email is required',
      })
      return
    }

    if (
      !data.password ||
      typeof data.password !== 'string' ||
      data.password.trim().length === 0
    ) {
      res.status(400).json({
        success: false,
        error: 'Password is required',
      })
      return
    }

    if (
      !data.name ||
      typeof data.name !== 'string' ||
      data.name.trim().length === 0
    ) {
      res.status(400).json({
        success: false,
        error: 'Name is required',
      })
      return
    }

    const result = await AuthService.register(data)

    if (result) {
      res.status(201).json({
        success: true,
        data: result,
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'User already exists',
      })
    }
  }

  static async login(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
  ): Promise<void> {
    const data: LoginRequest = req.body

    if (
      !data.email ||
      typeof data.email !== 'string' ||
      data.email.trim().length === 0
    ) {
      res.status(400).json({
        success: false,
        error: 'Email is required',
      })
      return
    }

    if (
      !data.password ||
      typeof data.password !== 'string' ||
      data.password.trim().length === 0
    ) {
      res.status(400).json({
        success: false,
        error: 'Password is required',
      })
      return
    }

    const result = await AuthService.login(data)

    if (result) {
      res.status(200).json({
        success: true,
        data: result,
      })
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      })
    }
  }

  static async me(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        userId: req.user.userId,
        email: req.user.email,
      },
    })
  }

  static async createTerminalSession(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
  ): Promise<void> {
    try {
      const uuid1 = v4()
      const uuid2 = v4()
      const uuid3 = v4()
      const token = uuid1 + ':' + uuid2 + ':' + uuid3
      const session = await db?.TerminalSessionModel.create({
        token,
      })

      if (!session || !session?._id) {
        res.status(500).json({
          success: false,
          error: 'Failed to create session',
        })
        return
      }

      res.status(201).json({
        success: true,
        message: 'Session created successfully',
        data: {
          sessionId: session._id.toString(),
          token,
        },
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      })
    }
  }

  static async completeTerminalSession(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
      return
    }

    try {
      const userId = req.user.userId
      const token = req.params.token

      if (!token || typeof token !== 'string' || token.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Token is required',
        })
        return
      }

      const session = await db?.TerminalSessionModel.findOne({ token }).lean()
      if (!session || !session?._id) {
        res.status(404).json({
          success: false,
          error: 'Session not found',
        })
        return
      }

      if (session.status === 'active') {
        res.status(400).json({
          success: false,
          error: 'Session already used',
        })
        return
      }

      await db?.TerminalSessionModel.updateOne(
        { _id: session._id },
        { $set: { userId, status: 'active' } },
      )

      res.status(200).json({
        success: true,
        message: 'Session validated successfully',
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      })
    }
  }

  static async checkTerminalSession(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
  ): Promise<void> {
    try {
      const sessionId = req.params.sessionId

      if (
        !sessionId ||
        typeof sessionId !== 'string' ||
        sessionId.trim().length === 0
      ) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required',
          data: {
            valid: 'inactive',
            email: '',
            token: '',
          },
        })
        return
      }

      const session =
        await db?.TerminalSessionModel.findById(sessionId).populate('userId')

      if (!session || !session?._id) {
        res.status(404).json({
          success: false,
          error: 'Session not found',
          data: {
            valid: 'inactive',
            email: '',
            token: '',
          },
        })
        return
      }

      const user = session.userId as IUser
      const userId = user._id?.toString()
      const email = user.email

      if (!user || !userId || !email) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          data: {
            valid: 'inactive',
            email: '',
            token: '',
          },
        })
        return
      }

      let token = ''
      if (session.status === 'active') {
        const generatedToken = AuthService.generateToken({
          email: email,
          userId: userId,
          type: 'terminal',
          sessionId: session._id.toString(),
        })
        token = generatedToken
      }

      res.status(200).json({
        success: true,
        message: 'Session checked successfully',
        data: {
          valid: session.userId ? session.status : 'inactive',
          email: email,
          token,
        },
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        data: {
          valid: 'inactive',
          email: '',
          token: '',
        },
      })
    }
  }
}

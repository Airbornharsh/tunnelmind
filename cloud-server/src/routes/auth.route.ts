import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { AuthMiddleware } from '../middlewares/auth.middleware'

export const authRouter = Router()

authRouter.post('/register', AuthController.register)
authRouter.post('/login', AuthController.login)
authRouter.get('/me', AuthMiddleware.authMiddleware, AuthController.me)

authRouter.post('/session', AuthController.createTerminalSession)
authRouter.post(
  '/session/:token',
  AuthMiddleware.authMiddleware,
  AuthController.completeTerminalSession,
)
authRouter.get('/session/:sessionId', AuthController.checkTerminalSession)

import { Router } from 'express'
import { TakerController } from '../controllers/taker.controller'
import { AuthMiddleware } from '../middlewares/auth.middleware'

export const takerRouter = Router()

takerRouter.get(
  '/models',
  AuthMiddleware.authMiddleware,
  TakerController.getAvailableModels,
)

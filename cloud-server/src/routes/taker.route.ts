import { Router } from 'express'
import { TakerController } from '../controllers/taker.controller'
import { AuthMiddleware } from '../middlewares/auth.middleware'

export const takerRouter = Router()

takerRouter.use(AuthMiddleware.authMiddleware)

takerRouter.get('/models', TakerController.getAvailableModels)
takerRouter.post('/inference', TakerController.requestInference)

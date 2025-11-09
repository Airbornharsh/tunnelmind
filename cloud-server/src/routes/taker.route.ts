import { Router } from 'express'
import { TakerController } from '../controllers/taker.controller'
import { AuthMiddleware } from '../middlewares/auth.middleware'

export const takerRouter = Router()

takerRouter.use(AuthMiddleware.authMiddleware)

takerRouter.get('/models', TakerController.getAvailableModels)
takerRouter.post('/tunnel', TakerController.createTunnel)
takerRouter.get('/tunnel/:tunnelId', TakerController.getTunnel)

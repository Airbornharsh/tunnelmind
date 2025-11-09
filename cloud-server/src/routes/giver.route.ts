import { Router } from 'express'
import { GiverController } from '../controllers/giver.controller'
import { AuthMiddleware } from '../middlewares/auth.middleware'

export const giverRouter = Router()

giverRouter.use(AuthMiddleware.authMiddleware)

giverRouter.get('/', GiverController.getAvailableGivers)
giverRouter.get('/:id', GiverController.getGiver)
giverRouter.post('/register', GiverController.register)
giverRouter.post('/:id/status', GiverController.updateStatus)

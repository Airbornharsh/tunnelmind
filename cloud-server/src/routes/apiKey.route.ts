import { Router } from 'express'
import { ApiKeyController } from '../controllers/apiKey.controller'
import { AuthMiddleware } from '../middlewares/auth.middleware'

export const apiKeyRouter = Router()

apiKeyRouter.use(AuthMiddleware.authMiddleware)

apiKeyRouter.post('/', ApiKeyController.createApiKey)
apiKeyRouter.get('/', ApiKeyController.getApiKeys)
apiKeyRouter.get('/:id', ApiKeyController.getApiKey)
apiKeyRouter.delete('/:id', ApiKeyController.deleteApiKey)

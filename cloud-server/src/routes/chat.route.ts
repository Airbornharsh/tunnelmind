import { Router } from 'express'
import { ChatController } from '../controllers/chat.controller'
import { AuthMiddleware } from '../middlewares/auth.middleware'

export const chatRouter = Router()

chatRouter.use(AuthMiddleware.authMiddleware)

chatRouter.get('/', ChatController.listChats)
chatRouter.post('/', ChatController.createChat)
chatRouter.get('/:id', ChatController.getChat)
chatRouter.patch('/:id', ChatController.updateChatTitle)
chatRouter.post('/:id/messages', ChatController.sendMessage)

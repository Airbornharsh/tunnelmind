import { Router } from 'express'
import { authRouter } from './auth.route'
import { giverRouter } from './giver.route'
import { takerRouter } from './taker.route'
import { apiKeyRouter } from './apiKey.route'
import { chatRouter } from './chat.route'
import { TakerController } from '../controllers/taker.controller'
import { AuthMiddleware } from '../middlewares/auth.middleware'

export const router = Router()

router.use('/auth', authRouter)
router.use('/giver', giverRouter)
router.use('/taker', takerRouter)
router.use('/api-keys', apiKeyRouter)
router.use('/chats', chatRouter)

router.post(
  '/v1/chat/completions',
  AuthMiddleware.apiKeyMiddleware,
  TakerController.createChatCompletion,
)

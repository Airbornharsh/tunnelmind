import { Router } from 'express'
import { authRouter } from './auth.route'
import { giverRouter } from './giver.route'
import { takerRouter } from './taker.route'
import { apiKeyRouter } from './apiKey.route'

export const router = Router()

router.use('/auth', authRouter)
router.use('/giver', giverRouter)
router.use('/taker', takerRouter)
router.use('/api-keys', apiKeyRouter)

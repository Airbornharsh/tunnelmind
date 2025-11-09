import dotenv from 'dotenv'

dotenv.config()

export const PORT = parseInt(process.env.PORT || '6702')
export const CLOUD_SERVER_URL =
  process.env.CLOUD_SERVER_URL || 'http://localhost:6701'
export const CLOUD_WSS_SERVER_URL =
  process.env.CLOUD_WSS_SERVER_URL || 'ws://localhost:6701/ws'
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:6703'
export const GIVER_NAME = process.env.GIVER_NAME || 'My Giver'
export const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'

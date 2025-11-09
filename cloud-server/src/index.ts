import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import { connectDB, disconnectDB } from './db/mongo/init'
import { router } from './routes/index.route'
import { webSocketManager } from './websocket/WebSocketManager'
import { PORT, FRONTEND_URL } from './config/config'

dotenv.config()

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({
  server,
  path: '/ws',
})

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api', router)

webSocketManager.initialize(wss)

const startServer = async () => {
  try {
    await connectDB()

    server.listen(PORT, () => {
      console.log(`🚀 Cloud server running on port ${PORT}`)
      console.log(`📡 WebSocket server ready`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    disconnectDB()
    process.exit(1)
  }
}

startServer()

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('Server closed')
    disconnectDB()
    process.exit(0)
  })
})

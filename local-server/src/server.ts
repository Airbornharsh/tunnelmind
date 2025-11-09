import express, { Request, Response } from 'express'
import cors from 'cors'
import { OllamaService } from './services/ollama.service'
import { TunnelClient } from './services/tunnelClient.service'
import { CLOUD_SERVER_URL, GIVER_NAME, OLLAMA_URL, PORT } from './config/config'

const app = express()

app.use(cors())
app.use(express.json())

const ollamaService = new OllamaService(OLLAMA_URL)
const tunnelClient = new TunnelClient(
  CLOUD_SERVER_URL,
  GIVER_NAME,
  ollamaService,
)

let isRegistered = false
let isConnected = false

app.get('/health', async (_req: Request, res: Response) => {
  try {
    const isHealthy = await ollamaService.checkHealth()
    res.json({
      status: 'ok',
      ollama: isHealthy ? 'connected' : 'disconnected',
      registered: isRegistered,
      connected: isConnected,
    })
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    })
  }
})

app.get('/api/models', async (_req: Request, res: Response) => {
  try {
    const models = await ollamaService.listModels()
    res.json({
      success: true,
      data: models,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      registered: isRegistered,
      connected: isConnected,
      giverId: tunnelClient.getGiverId(),
      giverName: GIVER_NAME,
      cloudServerUrl: CLOUD_SERVER_URL,
      ollamaUrl: OLLAMA_URL,
    },
  })
})

app.post('/api/register', async (_req: Request, res: Response) => {
  try {
    await tunnelClient.register()
    isRegistered = true
    res.json({
      success: true,
      message: 'Registered successfully',
      data: {
        giverId: tunnelClient.getGiverId(),
      },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

app.post('/api/connect', async (_req: Request, res: Response) => {
  try {
    if (!isRegistered) {
      return res.status(400).json({
        success: false,
        error: 'Not registered. Please register first.',
      })
    }

    await tunnelClient.connect()
    isConnected = true
    res.json({
      success: true,
      message: 'Connected successfully',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

app.post('/api/disconnect', (_req: Request, res: Response) => {
  try {
    tunnelClient.disconnect()
    isConnected = false
    res.json({
      success: true,
      message: 'Disconnected successfully',
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

async function startServer() {
  console.log('🚀 Starting TunnelMind Local Server...')
  console.log(`📡 Cloud Server: ${CLOUD_SERVER_URL}`)
  console.log(`🤖 Ollama URL: ${OLLAMA_URL}`)
  console.log(`👤 Giver Name: ${GIVER_NAME}`)
  console.log(`🌐 Server Port: ${PORT}`)
  console.log('')

  console.log('🔍 Verifying Ollama connection...')
  try {
    const isHealthy = await ollamaService.checkHealth()
    if (!isHealthy) {
      console.error('❌ Ollama is not running or not accessible')
      console.error(`   Please ensure Ollama is running at ${OLLAMA_URL}`)
      process.exit(1)
    }
    console.log('✅ Ollama is running')
  } catch (error: any) {
    console.error('❌ Failed to connect to Ollama:', error.message)
    console.error(`   Please ensure Ollama is running at ${OLLAMA_URL}`)
    process.exit(1)
  }

  console.log('📋 Fetching available models...')
  try {
    const models = await ollamaService.listModels()
    if (models.length === 0) {
      console.error('❌ No models found in Ollama')
      console.error('   Please download models using: ollama pull <model-name>')
      process.exit(1)
    }
    console.log(`✅ Found ${models.length} model(s):`)
    models.forEach((model) => {
      console.log(`   - ${model.name}`)
    })
  } catch (error: any) {
    console.error('❌ Failed to list models:', error.message)
    process.exit(1)
  }

  console.log('📝 Registering with cloud server...')
  try {
    await tunnelClient.register()
    isRegistered = true
    console.log('✅ Registered successfully')
  } catch (error: any) {
    console.error('❌ Failed to register:', error.message)
    console.error('   You can register manually via POST /api/register')
  }

  if (isRegistered) {
    console.log('🔌 Connecting to cloud server...')
    try {
      await tunnelClient.connect()
      isConnected = true
      console.log('✅ Connected and ready to serve requests')
    } catch (error: any) {
      console.error('❌ Failed to connect:', error.message)
      console.error('   You can connect manually via POST /api/connect')
    }
  }

  app.listen(PORT, () => {
    console.log('')
    console.log(`🌐 Local server running on http://localhost:${PORT}`)
    console.log('')
    console.log('📋 Available endpoints:')
    console.log(`   GET  http://localhost:${PORT}/health`)
    console.log(`   GET  http://localhost:${PORT}/api/models`)
    console.log(`   GET  http://localhost:${PORT}/api/status`)
    console.log(`   POST http://localhost:${PORT}/api/register`)
    console.log(`   POST http://localhost:${PORT}/api/connect`)
    console.log(`   POST http://localhost:${PORT}/api/disconnect`)
    console.log('')
    console.log('💡 Press Ctrl+C to stop the server')
  })

  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...')
    tunnelClient.disconnect()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down...')
    tunnelClient.disconnect()
    process.exit(0)
  })
}

export { app, startServer }

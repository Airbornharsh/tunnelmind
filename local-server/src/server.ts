import { OllamaService } from './services/ollama.service'
import { TunnelClient } from './services/tunnelClient.service'
import { CLOUD_SERVER_URL, OLLAMA_URL } from './config/config'

const ollamaService = new OllamaService(OLLAMA_URL)
const tunnelClient = new TunnelClient(CLOUD_SERVER_URL, ollamaService)

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function ensureOllamaReady() {
  console.log('🔍 Verifying Ollama connection...')
  try {
    const isHealthy = await ollamaService.checkHealth()
    if (!isHealthy) {
      throw new Error('Ollama is not running or not accessible')
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
}

async function connectWithRetry() {
  while (true) {
    console.log('🔌 Connecting to cloud server...')
    try {
      await tunnelClient.connect()
      console.log('✅ Connected and ready to serve requests')
      return
    } catch (error: any) {
      console.error('❌ Failed to connect:', error.message)
      if (
        typeof error?.message === 'string' &&
        error.message.includes('Session token not found')
      ) {
        console.error(
          '   Please login using `tunnelmind login` in a separate terminal.',
        )
        console.error('   Will retry in 30 seconds...')
        await delay(30_000)
      } else if (
        typeof error?.message === 'string' &&
        error.message.includes('No models available locally')
      ) {
        console.error(
          '   Download an Ollama model before continuing. Retrying in 30 seconds...',
        )
        await delay(30_000)
      } else {
        console.error('   Retrying in 10 seconds...')
        await delay(10_000)
      }
    }
  }
}

async function startServer() {
  console.log('🚀 Starting TunnelMind Local Server...')
  console.log(`📡 Cloud Server: ${CLOUD_SERVER_URL}`)
  console.log(`🤖 Ollama URL: ${OLLAMA_URL}`)
  console.log('')

  await ensureOllamaReady()
  await connectWithRetry()

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

export { startServer }

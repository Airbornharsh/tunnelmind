import axios, { AxiosInstance } from 'axios'
import OpenAI from 'openai'

export interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
}

export interface OllamaGenerateRequest {
  model: string
  prompt: string
  stream?: boolean
  options?: {
    temperature?: number
    top_p?: number
    top_k?: number
    num_predict?: number
  }
}

export class OllamaService {
  private client: AxiosInstance
  private openai: OpenAI

  constructor(baseURL: string = 'http://localhost:11434') {
    this.client = axios.create({
      baseURL,
      timeout: 300000,
    })

    const normalizedBase = baseURL.endsWith('/')
      ? baseURL.slice(0, -1)
      : baseURL
    this.openai = new OpenAI({
      baseURL: `${normalizedBase}/v1`,
      apiKey: 'ollama',
    })
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await this.client.get('/api/tags')
      return response.data.models || []
    } catch (error: any) {
      throw new Error(`Failed to list Ollama models: ${error.message}`)
    }
  }

  async generate(request: OllamaGenerateRequest): Promise<any> {
    try {
      const response = await this.client.post('/api/generate', request, {
        responseType: 'stream',
      })
      return response.data
    } catch (error: any) {
      throw new Error(`Failed to generate: ${error.message}`)
    }
  }

  async chat(request: {
    model: string
    messages: Array<{ role: string; content: string }>
    stream?: boolean
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/chat', request, {
        responseType: 'stream',
      })
      return response.data
    } catch (error: any) {
      throw new Error(`Failed to chat: ${error.message}`)
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.client.get('/api/tags')
      return true
    } catch {
      return false
    }
  }

  async *chatCompletionStream(
    params: Record<string, any>,
  ): AsyncGenerator<string> {
    const response = await this.openai.chat.completions.create({
      ...params,
      messages: params.messages,
      model: params.model,
      stream: true,
    })

    for await (const chunk of response) {
      const content = chunk?.choices?.[0]?.delta?.content || ''
      if (content) {
        yield content
      }
    }
  }
}

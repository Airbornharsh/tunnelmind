import { Response } from 'express'
import { AuthenticatedRequest, ApiResponse } from '../types'
import { GiverService } from '../services/giver.service'
import { webSocketManager } from '../websocket/WebSocketManager'

export class TakerController {
  static async getAvailableModels(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
      return
    }

    const result = await GiverService.getAvailableModels()

    res.status(200).json({
      success: true,
      data: result,
    })
  }

  static async requestInference(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        })
        return
      }

      const { model, prompt, options } = req.body || {}

      const trimmedModel =
        typeof model === 'string' ? model.trim() : (model as string)

      if (!trimmedModel) {
        res.status(400).json({
          success: false,
          error: 'Model is required',
        })
        return
      }

      const trimmedPrompt =
        typeof prompt === 'string' ? prompt.trim() : (prompt as string)

      if (!trimmedPrompt) {
        res.status(400).json({
          success: false,
          error: 'Prompt is required',
        })
        return
      }

      const result = await webSocketManager.requestInference(trimmedModel, {
        prompt: trimmedPrompt,
        options,
        userId: req.user.userId,
      })

      res.status(200).json({
        success: true,
        data: {
          model: trimmedModel,
          response: result.response,
          chunks: result.chunks,
          giverId: result.giverId,
        },
      })
    } catch (error: any) {
      res.status(503).json({
        success: false,
        error: error?.message || 'Failed to process inference request',
      })
    }
  }
}

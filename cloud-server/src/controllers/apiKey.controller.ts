import { Response } from 'express'
import { AuthenticatedRequest, ApiResponse } from '../types'
import { ApiKeyService } from '../services/apiKey.service'

export class ApiKeyController {
  static async createApiKey(
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

    const { name } = req.body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'API key name is required',
      })
      return
    }

    const result = await ApiKeyService.createApiKey(
      req.user.userId,
      name.trim(),
    )

    if (result) {
      res.status(201).json({
        success: true,
        data: {
          apiKey: result.apiKey,
          info: result.info,
        },
      })
    } else {
      res.status(400).json({
        success: false,
      })
    }
  }

  static async getApiKeys(
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

    const apiKeys = await ApiKeyService.getApiKeys(req.user.userId)

    res.status(200).json({
      success: true,
      data: {
        apiKeys: apiKeys,
      },
    })
  }

  static async deleteApiKey(
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

    const { id } = req.params
    const success = await ApiKeyService.deleteApiKey(req.user.userId, id)

    res.status(200).json({
      success,
    })
  }
}

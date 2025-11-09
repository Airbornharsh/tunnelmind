import { Response } from 'express'
import {
  AuthenticatedRequest,
  ApiResponse,
  RegisterGiverRequest,
} from '../types'
import { GiverService } from '../services/giver.service'

export class GiverController {
  static async register(
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

    const data: RegisterGiverRequest = req.body

    const userId = req.user?.userId || 'cli-user'

    if (
      !data.name ||
      typeof data.name !== 'string' ||
      data.name.trim().length === 0
    ) {
      res.status(400).json({
        success: false,
        error: 'Name is required',
      })
      return
    }

    if (
      !data.models ||
      !Array.isArray(data.models) ||
      data.models.length === 0
    ) {
      res.status(400).json({
        success: false,
        error: 'At least one model is required',
      })
      return
    }

    const result = await GiverService.register(userId, data)

    if (result) {
      res.status(201).json({
        success: true,
        data: result,
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'Giver registration failed',
      })
    }
  }

  static async updateStatus(
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
    const { status, models } = req.body

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Giver ID is required',
      })
      return
    }

    if (!status || (status !== 'online' && status !== 'offline')) {
      res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "online" or "offline"',
      })
      return
    }

    if (models && (!Array.isArray(models) || models.length === 0)) {
      res.status(400).json({
        success: false,
        error: 'Models must be a non-empty array',
      })
      return
    }

    const result = await GiverService.updateStatus(id, status, models)

    if (result) {
      res.status(200).json({
        success: true,
      })
    } else {
      res.status(404).json({
        success: false,
        error: 'Giver not found',
      })
    }
  }

  static async getGiver(
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

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Giver ID is required',
      })
      return
    }

    const result = await GiverService.getGiver(id)

    if (result) {
      res.status(200).json({
        success: true,
        data: result,
      })
    } else {
      res.status(404).json({
        success: false,
        error: 'Giver not found',
      })
    }
  }

  static async getAvailableGivers(
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

    const result = await GiverService.getAvailableGivers()

    res.status(200).json({
      success: true,
      data: result,
    })
  }
}

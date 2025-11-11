import { Response } from 'express'
import { AuthenticatedRequest, ApiResponse } from '../types'
import { GiverService } from '../services/giver.service'

export class GiverController {
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

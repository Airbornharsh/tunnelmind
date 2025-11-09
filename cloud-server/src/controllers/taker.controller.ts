import { Response } from 'express'
import {
  AuthenticatedRequest,
  ApiResponse,
  CreateTunnelRequest,
} from '../types'
import { TunnelService } from '../services/tunnel.service'
import { GiverService } from '../services/giver.service'

export class TakerController {
  static async createTunnel(
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

    const data: CreateTunnelRequest = req.body

    if (
      !data.model ||
      typeof data.model !== 'string' ||
      data.model.trim().length === 0
    ) {
      res.status(400).json({
        success: false,
        error: 'Model is required',
      })
      return
    }

    const tunnelResult = await TunnelService.createTunnel(data)

    if (tunnelResult) {
      const authHeader = req.headers.authorization
      const token = authHeader?.substring(7) || authHeader || ''

      const host = req.get('host')?.split(':')[0] || 'localhost'
      const port = req.get('host')?.split(':')[1] || process.env.PORT || '6701'
      const wsUrl = `ws://${host}:${port}/ws?role=taker&tunnelId=${tunnelResult.tunnelId}&token=${token}`

      res.status(201).json({
        success: true,
        data: {
          tunnelId: tunnelResult.tunnelId,
          wsUrl,
          model: data.model,
          status: 'waiting',
        },
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'Tunnel creation failed',
      })
    }
  }

  static async getTunnel(
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

    const { tunnelId } = req.params

    if (
      !tunnelId ||
      typeof tunnelId !== 'string' ||
      tunnelId.trim().length === 0
    ) {
      res.status(400).json({
        success: false,
        error: 'Tunnel ID is required',
      })
      return
    }

    const tunnelResult = await TunnelService.getTunnel(tunnelId)

    if (tunnelResult) {
      res.status(200).json({
        success: true,
        data: tunnelResult,
      })
    } else {
      res.status(404).json({
        success: false,
        error: 'Tunnel not found',
      })
    }
  }

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
}

import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/mongo/init'
import { CreateTunnelRequest } from '../types'
import { GiverService } from './giver.service'

export class TunnelService {
  static async createTunnel(
    data: CreateTunnelRequest,
  ): Promise<{ tunnelId: string } | null> {
    try {
      if (!db?.TunnelModel || !db?.GiverModel) {
        throw new Error('Database not initialized')
      }

      if (!data.model) {
        return null
      }

      const tunnel = await db.TunnelModel.create({
        modelName: data.model,
        status: 'waiting',
        giverId: null,
      })

      if (!tunnel || !tunnel._id) {
        throw new Error('Failed to create tunnel')
      }

      return {
        tunnelId: tunnel._id.toString(),
      }
    } catch (error: any) {
      return null
    }
  }

  static async getTunnel(tunnelId: string): Promise<{
    tunnelId: string
    giverId: string | null
    model: string
    status: string
    createdAt: Date
  } | null> {
    try {
      if (!db?.TunnelModel) {
        throw new Error('Database not initialized')
      }

      const tunnel = await db.TunnelModel.findById(tunnelId).populate('giverId')

      if (!tunnel || !tunnel._id) {
        return null
      }

      return {
        tunnelId: tunnel._id.toString(),
        giverId: tunnel.giverId?.toString() || null,
        model: tunnel.modelName,
        status: tunnel.status,
        createdAt: tunnel.createdAt,
      }
    } catch (error: any) {
      return null
    }
  }

  static async closeTunnel(tunnelId: string): Promise<boolean> {
    try {
      if (!db?.TunnelModel) {
        throw new Error('Database not initialized')
      }

      const tunnel = await db.TunnelModel.findById(tunnelId)
      if (!tunnel) {
        return false
      }

      tunnel.status = 'closed'
      tunnel.giverId = null
      await tunnel.save()

      return true
    } catch (error: any) {
      return false
    }
  }

  static async assignGiver(
    tunnelId: string,
    giverId: string,
  ): Promise<boolean> {
    try {
      if (!db?.TunnelModel) {
        throw new Error('Database not initialized')
      }

      const tunnel = await db.TunnelModel.findById(tunnelId)
      if (!tunnel) {
        return false
      }

      tunnel.giverId = giverId as any
      tunnel.status = 'active'
      await tunnel.save()

      return true
    } catch (error: any) {
      return false
    }
  }

  static async unassignGiver(tunnelId: string): Promise<boolean> {
    try {
      if (!db?.TunnelModel) {
        throw new Error('Database not initialized')
      }

      const tunnel = await db.TunnelModel.findById(tunnelId)
      if (!tunnel) {
        return false
      }

      tunnel.giverId = null
      tunnel.status = 'waiting'
      await tunnel.save()

      return true
    } catch (error: any) {
      return false
    }
  }
}

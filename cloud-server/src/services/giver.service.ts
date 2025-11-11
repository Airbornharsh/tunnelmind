import { db } from '../db/mongo/init'
import { Giver } from '../types'

export class GiverService {
  static async upsertGiverFromConnection(
    userId: string,
    name: string | null,
    models?: string[],
  ): Promise<Giver | null> {
    try {
      const now = new Date()
      const giverModels =
        models && Array.isArray(models) && models.length > 0
          ? models
          : undefined

      let giver = await db.GiverModel.findOne({ userId })

      const normalizedName =
        typeof name === 'string' && name.trim().length > 0
          ? name.trim()
          : giver?.name || 'Unnamed Giver'

      if (!giver) {
        giver = await db.GiverModel.create({
          userId,
          name: normalizedName,
          models: giverModels || [],
          status: 'online',
          lastSeen: now,
        })
      } else {
        giver.name = normalizedName
        if (giverModels) {
          giver.models = giverModels
        }
        giver.status = 'online'
        giver.lastSeen = now
        await giver.save()
      }

      if (!giver._id) {
        throw new Error('Failed to find giver')
      }

      return {
        id: giver._id.toString(),
        userId: giver.userId.toString(),
        name: giver.name,
        status: giver.status,
        models: Array.isArray(giver.models) ? giver.models : [],
        lastSeen: giver.lastSeen,
        endpoint: giver.endpoint,
      }
    } catch (error: any) {
      return null
    }
  }

  static async setStatus(
    giverId: string,
    status: 'online' | 'offline',
    models?: string[],
  ): Promise<boolean> {
    try {
      const giver = await db.GiverModel.findById(giverId)
      if (!giver) {
        return false
      }

      giver.status = status
      giver.lastSeen = new Date()
      if (models) {
        giver.models = models
      }

      await giver.save()

      return true
    } catch (error: any) {
      return false
    }
  }

  static async getGiver(giverId: string): Promise<Giver | null> {
    try {
      const giver = await db.GiverModel.findById(giverId).populate('userId')
      if (!giver || !giver._id) {
        return null
      }

      return {
        id: giver._id.toString(),
        userId: giver.userId.toString(),
        name: giver.name,
        status: giver.status,
        models: Array.isArray(giver.models) ? giver.models : [],
        lastSeen: giver.lastSeen,
        endpoint: giver.endpoint,
      }
    } catch (error: any) {
      return null
    }
  }

  static async getAvailableGivers(): Promise<Giver[]> {
    try {
      const givers = await db.GiverModel.find({ status: 'online' }).populate(
        'userId',
      )

      return givers
        .map((giver) =>
          giver && giver._id
            ? {
                id: giver._id.toString(),
                userId: giver.userId.toString(),
                name: giver.name,
                status: giver.status,
                models: giver.models,
                lastSeen: giver.lastSeen,
                endpoint: giver.endpoint,
              }
            : null,
        )
        .filter((giver) => giver !== null) as Giver[]
    } catch (error: any) {
      return []
    }
  }

  static async findGiverByModel(
    model: string,
    giverId?: string,
  ): Promise<Giver | null> {
    try {
      let giver

      if (giverId) {
        giver = await db.GiverModel.findById(giverId).populate('userId')
        if (!giver) {
          return null
        }

        if (!giver.models.includes(model)) {
          return null
        }

        if (giver.status !== 'online') {
          return null
        }
      } else {
        giver = await db.GiverModel.findOne({
          status: 'online',
          models: { $in: [model] },
        }).populate('userId')

        if (!giver) {
          return null
        }
      }

      if (!giver || !giver._id) {
        throw new Error('Failed to find giver')
      }

      return {
        id: giver._id.toString(),
        userId: giver.userId.toString(),
        name: giver.name,
        status: giver.status,
        models: giver.models,
        lastSeen: giver.lastSeen,
        endpoint: giver.endpoint,
      }
    } catch (error: any) {
      return null
    }
  }

  static async getAvailableModels(): Promise<
    { model: string; givers: { id: string; name: string }[] }[]
  > {
    try {
      const givers = await db.GiverModel.find({ status: 'online' }).populate(
        'userId',
      )

      const modelMap = new Map<
        string,
        { id: string; name: string; status: string }[]
      >()

      givers.forEach((giver) => {
        giver.models.forEach((model) => {
          if (!modelMap.has(model)) {
            modelMap.set(model, [])
          }
          modelMap.get(model)?.push({
            id: giver._id?.toString() || '',
            name: giver.name,
            status: giver.status,
          })
        })
      })

      return Array.from(modelMap.entries()).map(([model, givers]) => ({
        model,
        givers,
      }))
    } catch (error: any) {
      return []
    }
  }
}

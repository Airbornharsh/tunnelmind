import mongoose from 'mongoose'

export interface IGiver extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  name: string
  status: 'online' | 'offline'
  models: string[]
  lastSeen: Date
  endpoint?: string
  createdAt: Date
  updatedAt: Date
}

const GiverSchema = new mongoose.Schema<IGiver>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    models: {
      type: [String],
      default: [],
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    endpoint: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
)

export default GiverSchema

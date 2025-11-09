import mongoose from 'mongoose'

export interface ITunnel extends mongoose.Document {
  giverId?: mongoose.Types.ObjectId | null
  modelName: string
  status: 'active' | 'closed' | 'waiting'
  createdAt: Date
  updatedAt: Date
}

const TunnelSchema = new mongoose.Schema<ITunnel>(
  {
    giverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Giver',
      required: false,
      default: null,
    },
    modelName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'waiting'],
      default: 'waiting',
    },
  },
  {
    timestamps: true,
  },
)

export default TunnelSchema

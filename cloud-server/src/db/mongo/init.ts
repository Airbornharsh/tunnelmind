import dotenv from 'dotenv'
dotenv.config()
import mongoose, { Model, Connection } from 'mongoose'
import { MONGO_URL } from '../../config/config'
import UserSchema, { IUser } from './models/User.schema'
import GiverSchema, { IGiver } from './models/Giver.schema'
import ApiKeySchema, { IApiKey } from './models/ApiKey.schema'
import TerminalSessionSchema, {
  ITerminalSession,
} from './models/TerminalSession.schema'

mongoose.set('strictQuery', false)

const dbUrl = MONGO_URL + '/tunnelmind'

let db: Db
let connection: Connection | null = null

interface Db {
  UserModel: Model<IUser>
  GiverModel: Model<IGiver>
  ApiKeyModel: Model<IApiKey>
  TerminalSessionModel: Model<ITerminalSession>
}

const connectDB = async () => {
  try {
    connection = await mongoose.createConnection(dbUrl)

    const UserModel = connection.model<IUser>('User', UserSchema)
    const GiverModel = connection.model<IGiver>('Giver', GiverSchema)
    const ApiKeyModel = connection.model<IApiKey>('ApiKey', ApiKeySchema)
    const TerminalSessionModel = connection.model<ITerminalSession>(
      'TerminalSession',
      TerminalSessionSchema,
    )

    db = {
      UserModel,
      GiverModel,
      ApiKeyModel,
      TerminalSessionModel,
    }
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error)
    throw new Error(error)
  }
}

const disconnectDB = async () => {
  try {
    if (connection) {
      await connection.close()
      console.log('✅ MongoDB connection closed')
    }
  } catch (error: any) {
    console.error('❌ Error closing DB connections:', error)
  }
}

export { connectDB, disconnectDB, db }

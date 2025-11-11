export const PORT = process.env.PORT || 6701
export const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017'

export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:6703'

export const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export const API_KEY_ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY || null
export const API_KEY_ENCRYPTION_SECRET =
  process.env.API_KEY_ENCRYPTION_SECRET || null

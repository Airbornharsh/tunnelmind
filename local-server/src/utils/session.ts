import path from 'path'
import os from 'os'
import fs from 'fs'

const sessionPath = path.join(os.homedir(), '.tunnelmind_session')

class Session {
  static async getSession(): Promise<{ email: string; token: string } | null> {
    try {
      const session = await fs.promises.readFile(sessionPath, 'utf8')
      return JSON.parse(session)
    } catch (error) {
      return null
    }
  }

  static setSession(session: { email: string; token: string }): void {
    try {
      fs.writeFileSync(sessionPath, JSON.stringify(session))
    } catch {}
  }

  static deleteSession(): void {
    try {
      fs.unlinkSync(sessionPath)
    } catch {}
  }

  static async getSessionToken(): Promise<string | null> {
    const session = await this.getSession()
    if (!session) {
      return null
    }

    return session.token
  }
}

export default Session

import dotenv from 'dotenv'
import { Command } from 'commander'
import loginCommand from './login'
import userCommand from './user'
import logoutCommand from './logout'
import { startServer } from '../server'

dotenv.config()

export function startCLI() {
  const program = new Command()

  const args = process.argv.filter((arg, index) => {
    if (index < 2) return true
    return arg !== 'cli'
  })

  program
    .name('tunnelmind')
    .description(
      'TunnelMind Local Server - Share your Ollama models (CLI Mode)',
    )
    .version('1.0.0')
    .action(async (options) => {
      const command = args[2]
      if (command === 'login') {
        await loginCommand()
      } else if (command === 'user') {
        await userCommand()
      } else if (command === 'logout') {
        await logoutCommand()
      } else if (command === 'server') {
        await startServer()
      } else {
        console.error(`Invalid command: ${command}`)
        process.exit(1)
      }
    })

  program.parse(args)
}

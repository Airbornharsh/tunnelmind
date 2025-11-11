import dotenv from 'dotenv'
import { Command } from 'commander'
import packageJson from '../../package.json'
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
    .version(packageJson.version)

  program
    .command('login')
    .description('Authenticate this CLI with your TunnelMind account')
    .action(async () => {
      await loginCommand()
    })

  program
    .command('user')
    .description('Show the currently authenticated CLI user')
    .action(async () => {
      await userCommand()
    })

  program
    .command('logout')
    .description('Clear the CLI authentication session')
    .action(async () => {
      await logoutCommand()
    })

  program
    .command('server')
    .description('Start the TunnelMind local server')
    .action(async () => {
      await startServer()
    })

  program
    .command('help', { isDefault: true })
    .description('Show this help message')
    .action(() => {
      program.outputHelp()
    })

  program.parse(args)
}

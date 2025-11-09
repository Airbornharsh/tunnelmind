#!/usr/bin/env node
import { startServer } from './server'
import { startCLI } from './commands/start'

const isServerMode = process.argv.includes('server')

if (isServerMode) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error)
    process.exit(1)
  })
} else {
  startCLI()
}

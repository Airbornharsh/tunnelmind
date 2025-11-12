# TunnelMind

A distributed platform that enables users to share GPU resources and AI models. "Givers" can share their local Ollama models, and "Takers" can access them through secure tunneling.

## Quick Links

- **Live App:** [https://tunnelmind.harshkeshri.com](https://tunnelmind.harshkeshri.com)
- **NPM Package:** [https://www.npmjs.com/package/tunnelmind](https://www.npmjs.com/package/tunnelmind)

## Installation

TunnelMind ships with a CLI that lets you authenticate, start the local relay, and publish your Ollama models to the cloud.

```bash
npm install -g tunnelmind
```

Prerequisites:

- Node.js 18+
- Ollama installed and running locally (`ollama serve`)
- At least one model pulled via `ollama pull <model>`

## Usage

Authenticate the CLI:

```bash
tunnelmind login
```

Start sharing your local models:

```bash
tunnelmind server
```

Optional flags:

- `--cloud-url` to point at a different TunnelMind cloud server
- `--ollama-url` to target a custom Ollama endpoint

Check the current session:

```bash
tunnelmind user
```

Log out and clear the local session:

```bash
tunnelmind logout
```

## Project Structure

- `cloud-server/` – Express + MongoDB backend managing givers, takers, chats, and the WebSocket relay.
- `local-server/` – CLI client that connects a giver’s Ollama instance to the cloud server.
- `frontend/` – Next.js frontend for takers and givers to manage sessions, browse models, and chat.

## Development

Install dependencies for all packages:

```bash
pnpm install:all
```

Start individual services:

```bash
# Cloud server
eval "cd cloud-server && pnpm dev"

# Local CLI (debug mode)
eval "cd local-server && pnpm dev:cli"

# Frontend
eval "cd frontend && pnpm dev"
```

## Contributing

Pull requests and feature suggestions are welcome. Please open an issue describing your proposal before submitting large changes.

## License

MIT © TunnelMind

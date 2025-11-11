# TunnelMind Local Server

The TunnelMind local server lets you share your local Ollama models securely with cloud takers. It also includes a CLI that handles authentication, session management, and starting the websocket tunnel to the cloud server.

## Features

- Authenticate via browser OAuth flow (`tunnelmind login`).
- Inspect linked account information (`tunnelmind user`).
- Launch the websocket tunnel that reports your local Ollama models to the cloud (`tunnelmind server`).
- Gracefully disconnect and remove local session data (`tunnelmind logout`).

## Getting Started

```bash
npm install -g tunnelmind
```

## CLI Commands

| Command             | Description                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `tunnelmind login`  | Open the browser flow and authenticate your CLI session.                                 |
| `tunnelmind user`   | Display the currently authenticated account.                                             |
| `tunnelmind server` | Connect to the cloud server, verify Ollama models, and register this machine as a giver. |
| `tunnelmind logout` | Clear local session data.                                                                |

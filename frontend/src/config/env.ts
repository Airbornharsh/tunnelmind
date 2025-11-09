export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6701',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:6701/ws',
  appName: 'TunnelMind',
  appDescription: 'Distributed GPU and AI model sharing platform',
} as const

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const apiUrl = loadEnv(mode, process.cwd(), 'VITE_API_URL').VITE_API_URL
    if (apiUrl) {
      let hostname: string
      try {
        hostname = new URL(apiUrl).hostname
      } catch {
        throw new Error('VITE_API_URL doit être une URL valide.')
      }
      if (['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(hostname)) {
        throw new Error('VITE_API_URL ne peut pas pointer vers localhost dans un build de production.')
      }
    }
  }

  return { plugins: [react()] }
})

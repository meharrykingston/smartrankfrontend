import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const portFile = path.resolve(__dirname, '../api/.port')
const resolvedApiPort = (() => {
  try {
    const port = fs.readFileSync(portFile, 'utf-8').trim()
    return port ? Number(port) : null
  } catch {
    return null
  }
})()
const apiTarget = process.env.VITE_API_PROXY ?? `http://localhost:${resolvedApiPort ?? 4100}`

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})

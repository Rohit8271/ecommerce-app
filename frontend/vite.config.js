import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = mode === 'development'

  return {
    plugins: [react()],
    // In production, define VITE_API_BASE so fetch('/api/...') resolves correctly.
    // The Firebase Hosting rewrite in firebase.json will proxy /api/** → backend.
    define: isDev ? {} : {
      // No define needed; Firebase Hosting rewrites handle API routing
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true
        },
        '/uploads': {
          target: 'http://localhost:5001',
          changeOrigin: true
        }
      }
    }
  }
})

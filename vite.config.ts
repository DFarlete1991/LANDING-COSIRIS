import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/webhook': {
        target: 'https://n8n.srv1123447.hstgr.cloud/webhook/8383a34e-98f6-45b0-adda-77a6cdaf8abe',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/webhook/, ''),
      },
      '/api/webhook-captacion': {
        target: 'https://n8n.srv1123447.hstgr.cloud/webhook/d0652f82-339e-44be-b627-6d03353c2037',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/webhook-captacion/, ''),
      },
      '/api/webhook-valoracion': {
        target: 'https://n8n.srv1123447.hstgr.cloud/webhook/a775df38-0b86-474d-8fad-067049def95a',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/webhook-valoracion/, ''),
      },
    },
  },
})

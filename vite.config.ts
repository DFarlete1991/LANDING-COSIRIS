import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { SECURITY_HEADERS } from './scripts/security-headers.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    headers: SECURITY_HEADERS,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      // Segunda entrada HTML solo para que /inmobiliarias tenga sus propias
      // etiquetas og:title/og:description — la app en sí es la misma SPA
      // (mismo main.tsx), Vercel solo sirve este HTML en la carga inicial de
      // esa ruta (ver el rewrite en vercel.json) para que los crawlers de
      // WhatsApp/Facebook (que no ejecutan JS) vean el resumen correcto.
      input: {
        main: path.resolve(__dirname, 'index.html'),
        inmobiliarias: path.resolve(__dirname, 'inmobiliarias.html'),
      },
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

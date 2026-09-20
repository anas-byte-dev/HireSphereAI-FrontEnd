import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5175,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_TARGET || 'https://hiresphereai.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

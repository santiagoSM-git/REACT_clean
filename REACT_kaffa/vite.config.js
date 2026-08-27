import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo el frontend llama a /api/v1 relativa; Vite la proxea
    // al backend Laravel (php artisan serve). Para Apache en :80 quita el proxy.
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})

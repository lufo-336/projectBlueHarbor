import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Le chiamate a /api vengono inoltrate al backend ASP.NET Core in sviluppo,
// così frontend e backend restano same-origin e non serve configurare CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:7008',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

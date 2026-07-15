// ═══ SPRINT 1 ═══
// Proxy di sviluppo: il browser chiama /api sulla stessa origine di Vite
// (niente problemi CORS/cookie), Vite gira la chiamata al backend.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:5200', changeOrigin: true },
    },
  },
});

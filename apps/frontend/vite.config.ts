import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to bypass CORS issues during local development
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
});
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: !isProduction
      ? {
          '/api': {
            target: 'http://localhost:3000', // Local backend for dev
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
          },
        }
      : undefined, // Disable proxy in production
  },
  define: {
    'process.env.BACKEND_URL': JSON.stringify(
      isProduction
        ? 'https://app-monitor-2.onrender.com' // Render backend
        : 'http://localhost:3000' // Local backend
    ),
  },
});

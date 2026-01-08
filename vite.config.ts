import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react() 
  ],
  base: '/', 
  root: '.', 
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: false,
    // 🛑 REMOVED rollupOptions entirely. 
    // This allows Vite to use its default (working) splitting strategy.
  },
});
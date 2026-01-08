import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 🛑 SAFEMODE: NO Compression Plugin
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
    rollupOptions: {
      output: {
        manualChunks: undefined, 
      },
    },
  },
});
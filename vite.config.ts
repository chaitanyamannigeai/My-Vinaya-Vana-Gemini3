import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
    rollupOptions: {
      output: {
        // 🚀 PERFORMANCE FIX: Split code into smart chunks
        // This ensures the Homepage doesn't download Admin/Map code
        manualChunks: (id) => {
          if (id.includes('leaflet') || id.includes('react-leaflet')) {
            return 'maps'; // Heavy map libraries go here
          }
          if (id.includes('lucide-react')) {
            return 'icons'; // Icons go here
          }
          if (id.includes('node_modules')) {
            return 'vendor'; // Core libraries (React, etc) go here
          }
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
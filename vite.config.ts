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
        // 🚀 PHASE 1: SMART CHUNKING
        // Instead of forcing 1 giant file (which slows down load),
        // we separate the heavy Admin/Map libraries from the Public site.
        manualChunks: (id) => {
          // Put Leaflet (Maps) and React-Leaflet in a separate chunk
          // This saves ~200KB from the Homepage load
          if (id.includes('leaflet') || id.includes('react-leaflet')) {
            return 'maps-vendor';
          }
          // Put Admin Dashboard specific libs in their own chunk
          if (id.includes('recharts') || id.includes('chart')) {
            return 'admin-vendor';
          }
          // Everything else (React, Router) goes into the main bundle
          return null; 
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
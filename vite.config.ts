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
        // This ensures the Homepage downloads only what it needs
        manualChunks: (id) => {
          if (id.includes('leaflet') || id.includes('react-leaflet')) {
            return 'maps'; // Heavy map libraries go here (Admin only)
          }
          if (id.includes('lucide-react')) {
            return 'icons'; // Icons go here
          }
          if (id.includes('node_modules')) {
            return 'vendor'; // Core libraries (React, etc) go here
          }
        },
        // Using hash in filenames ensures users always get the fresh version
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    // 🚀 COMPRESSION: Gzip assets for smaller download sizes
    viteCompression({ algorithm: 'gzip' }) 
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
        // 🚀 SMART SPLITTING: Breaks the monolith into smaller chunks
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('lucide')) return 'ui-icons';
            if (id.includes('leaflet')) return 'maps';
            return 'vendor';
          }
        }
      },
    },
  },
});
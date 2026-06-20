import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['erplogo.png'],
      manifest: {
        name: 'ONE Creativa',
        short_name: 'ONE Creativa',
        description: 'Sistem HRIS Terintegrasi PT. Creativa Bridging International',
        theme_color: '#0c2e59',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'erplogo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'erplogo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('face-api')) {
              return 'vendor-faceapi'; // Isolasi face-api agar hanya dimuat saat fitur absensi dipakai
            }
            if (id.includes('@tensorflow')) {
              return 'vendor-tensorflow'; // Pisahkan tensorflow juga
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('xlsx') || id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-export';
            }
            if (id.includes('axios')) {
              return 'vendor-network';
            }
            return 'vendor-others';
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

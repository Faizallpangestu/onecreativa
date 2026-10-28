import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'preview-prerendered-login',
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url?.split('?')[0] === '/login') req.url = req.url.replace('/login', '/login.html');
          next();
        });
      },
    },
    VitePWA({
      disable: process.env.CREATIVA_PRERENDER === '1',
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['icons/favicon-32.png', 'robots.txt', 'sitemap.xml'],

      // Strategy: generateSW agar Vite otomatis buat service worker
      strategies: 'generateSW',

      // Workbox config — cache strategy
      workbox: {
        maximumFileSizeToCacheInBytes: 10485760, // Naikkan limit ke 10MB (default 2MB)
        // Cache the small shell at installation; cache feature assets when used.
        globPatterns: ['index.html', 'manifest.webmanifest', 'icons/*.png'],
        // Jangan cache model face-api (terlalu besar, gunakan cache terpisah)
        globIgnores: ['**/models/**'],
        cleanupOutdatedCaches: true,
        // Keep repeat visits on the lightweight public login, not the SPA fallback.
        navigateFallbackDenylist: [/^\/login(?:[./?]|$)/, /^\/(?:\?.*)?$/, /^\/api\//],
        runtimeCaching: [
          {
            // Authenticated API responses must always use current server permissions.
            urlPattern: /\/api\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: ({url, sameOrigin}) => sameOrigin && url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'creativa-assets-v2',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 tahun
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
        ]
      },

      manifest: {
        // Identity
        id: 'com.creativabridging.one',
        name: 'ONE Creativa',
        short_name: 'ONE Creativa',
        description: 'Sistem HRIS Terintegrasi PT. Creativa Bridging International. Kelola karyawan, absensi, lembur, dan payroll.',

        // Theme
        theme_color: '#0c2e59',
        background_color: '#0c1b33',

        // Display
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        start_url: '/login',
        scope: '/',

        // Language
        lang: 'id',
        dir: 'ltr',

        // Categories (membantu store di browser)
        categories: ['business', 'productivity'],

        // Icons — harus ada 192 dan 512 untuk installable PWA
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            // Maskable icon untuk adaptive icons (Android 8+)
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],

        // Screenshots — untuk PWA install dialog yang lebih informatif

        // Shortcuts — aksi cepat dari home screen (Android)
        shortcuts: [
          {
            name: 'Absensi',
            short_name: 'Absensi',
            description: 'Buka halaman absensi wajah',
            url: '/face-clock',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'Laporan Harian',
            short_name: 'Daily Report',
            description: 'Input laporan kerja harian',
            url: '/daily-report-karyawan',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
          }
        ],

        // Related apps
        prefer_related_applications: false
      }
    })
  ],

  build: {
    manifest: true,
    // Tingkatkan limit warning (face-api + tensorflow memang besar)
    chunkSizeWarningLimit: 1500,
    // Source map untuk production debugging (disable jika tidak perlu)
    sourcemap: false,
    rollupOptions: {
      input: { app: 'index.html', login: 'src/login-entry.js' },
      external: ['fs', 'path', 'crypto'],
      // Preserve the bundler's dependency boundaries; shared catch-all chunks
      // previously pulled charts, exports, and PDF code into the login page.
    }
  },

  server: {
    port: 5173,
    watch: { ignored: ['**/backend/storage/**'] },
    proxy: {
      '/api': {
        target: process.env.CREATIVA_API_TARGET || 'http://localhost',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => process.env.CREATIVA_API_TARGET ? path : path.replace(/^\/api/, '/One-creativa/backend/api')
      },
      '/uploads': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/uploads/, '/One-creativa/backend/uploads')
      },
      '/jisho': {
        target: 'https://jisho.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/jisho/, '')
      },
      '/takoboto': {
        target: 'https://takoboto.jp',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/takoboto/, '')
      }
    },
  },
})

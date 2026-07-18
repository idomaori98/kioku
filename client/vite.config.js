import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Kioku',
        short_name: 'Kioku',
        description: 'A trip journal that builds itself, day by day, from the whole family.',
        theme_color: '#111111',
        background_color: '#f5f5f4',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // Real-time data must never be served stale from the cache:
            // unread counts, DM threads/conversations, notifications, and the feed.
            urlPattern: ({ url, request }) =>
              request.method === 'GET' &&
              (/^\/api\/dm(\/|$)/.test(url.pathname) ||
                url.pathname.startsWith('/api/notifications') ||
                url.pathname === '/api/trips/feed'),
            handler: 'NetworkOnly',
          },
          {
            urlPattern: ({ url, request }) =>
              url.pathname.startsWith('/api/') && request.method === 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:5050',
    },
  },
  preview: {
    proxy: {
      '/api': 'http://localhost:5050',
    },
  },
})

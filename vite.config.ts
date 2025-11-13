import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/terrorscape/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'vite.svg'],
      manifest: {
        name: 'Terrorscape',
        short_name: 'Terrorscape',
        description: 'Звуковое сопровождение для настольной игры Terrorscape',
        theme_color: '#b01218',
        background_color: '#0c0c0c',
        display: 'standalone',
        orientation: 'portrait',
        start_url: process.env.NODE_ENV === 'production' ? '/terrorscape/' : '/',
        icons: [
          {
            src: process.env.NODE_ENV === 'production' ? '/terrorscape/icon-192x192.png' : '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: process.env.NODE_ENV === 'production' ? '/terrorscape/icon-512x512.png' : '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        // Временно можно использовать SVG, но для PWA лучше PNG
        // Если иконок нет, браузер может использовать favicon
      },
      workbox: {
        // Кэшируем все статические ресурсы при сборке для оффлайн работы
        // По умолчанию используется стратегия CacheFirst для всех файлов из globPatterns
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2,otf,ttf,json,mp3}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Кэшируем все локальные изображения для оффлайн работы
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            // Кэшируем звуки для оффлайн работы
            urlPattern: /\.(?:mp3|wav|ogg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sounds-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: 'localhost',
    port: 4173,
    strictPort: true,
  },
})

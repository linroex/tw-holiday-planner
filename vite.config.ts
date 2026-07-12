import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: './', // 相對路徑，GitHub Pages 子路徑或任何靜態主機都可直接部署
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-180.png'],
      manifest: {
        name: '2027 台灣連假規劃',
        short_name: '連假規劃',
        description: '規劃 2027 年的連假與特休：標記請假日、自動計算連假長度、分享給朋友',
        lang: 'zh-Hant-TW',
        display: 'standalone',
        theme_color: '#d4380d',
        background_color: '#fdfbf7',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
});

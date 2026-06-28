import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  // Vercel/Cloudflare 部署时自动设为 '/'; GitHub Pages 需要子路径 '/drift-diary/'
  base: (process.env.VERCEL || process.env.CF_PAGES) ? '/' : '/drift-diary/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          zustand: ['zustand'],
          zod: ['zod'],
        },
      },
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  // Vercel 部署不需子路径；GitHub Pages 时改为 '/drift-diary/'
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

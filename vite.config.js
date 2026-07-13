import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import base44Plugin from '@base44/vite-plugin'

export default defineConfig({
  logLevel: 'error',
  plugins: [react(), base44Plugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
    minify: false,
  },
})
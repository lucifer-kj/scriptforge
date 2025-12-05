import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Use esbuild for minification (faster and no extra dependency)
    minify: 'esbuild',
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Proxy /webhook requests to the n8n backend during development to avoid CORS
      '/webhook': {
        target: 'https://n8n.alphabusinessdesigns.co.uk',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  publicDir: 'public',
})

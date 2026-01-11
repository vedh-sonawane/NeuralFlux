import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/proxy': {
        target: 'https://ai.hackclub.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy/, '/proxy/v1/chat/completions'),
        secure: true,
      }
    }
  }
})

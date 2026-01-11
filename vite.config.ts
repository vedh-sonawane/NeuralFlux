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
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('Authorization', 'Bearer sk-hc-v1-9f014e0f299f43848b4aa17fa0c69b3f5347bb18ef7f4627b5cea30023ddc1ef');
          });
        },
      }
    }
  }
})

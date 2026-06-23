import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host:'0.0.0.0',
    port:1409,
    allowedHosts:true,
    proxy: {
      '/api': 'http://localhost:8080',
      '/auth': 'http://localhost:8080',
      '/admin': 'http://localhost:8080',
      '/passenger': 'http://localhost:8080',
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  define: {
    global: "window", // Thay global bằng window
  },
  resolve: {
    alias: {
      'simple-peer': 'simple-peer/simplepeer.min.js', // Sử dụng bản build
    },
  },
})

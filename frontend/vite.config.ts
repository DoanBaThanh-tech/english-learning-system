import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Nếu 5173 đang bận, Vite tự chuyển sang cổng kế tiếp thay vì dừng.
    strictPort: false,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
})

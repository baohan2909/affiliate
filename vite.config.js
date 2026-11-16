import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE: '/' khi chạy tên miền riêng (affiliate.nonson.vn), '/ns-affiliate-hub/' khi chạy GitHub Pages mặc định
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  build: {
    target: 'es2019',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
})

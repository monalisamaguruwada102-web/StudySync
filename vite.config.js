import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/study/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true, // Listen on all local IPs
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'chart.js', 'react-chartjs-2'],
          icons: ['lucide-react'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})

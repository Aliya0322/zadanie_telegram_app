import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin to handle konsta package resolution issue
// Works in both dev and build modes on Vercel
const konstaPlugin = () => ({
  name: 'konsta-resolve',
  enforce: 'pre',
  resolveId(id) {
    // If Vite tries to resolve 'konsta' directly, redirect to 'konsta/react'
    if (id === 'konsta') {
      return { id: 'konsta/react', external: false }
    }
    return null
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [konstaPlugin(), react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Разделение на чанки по путям
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('@heroicons')) {
              return 'icons-vendor';
            }
            if (id.includes('konsta')) {
              return 'konsta-vendor';
            }
            // Остальные node_modules в отдельный чанк
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'konsta/react'],
    exclude: ['konsta'],
  },
})

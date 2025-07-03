import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true
    }
  },
  optimizeDeps: {
    include: [
      'monaco-editor',
      'xterm',
      'xterm-addon-fit'
    ]
  },
  define: {
    // Monaco Editor requires this global
    global: 'globalThis'
  },
  worker: {
    format: 'es'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['monaco-editor'],
          xterm: ['xterm', 'xterm-addon-fit']
        }
      }
    }
  }
})
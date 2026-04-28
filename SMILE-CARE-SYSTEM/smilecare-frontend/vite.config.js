import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
  },
  esbuild: {
    // Drop debugger and console.log, but retain console.error and console.warn
    drop: ['debugger'],
    pure: ['console.log', 'console.info', 'console.debug'],
  }
})

import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  // ESTO ES LO QUE FALTA:
  base: './',
  plugins: [
    vue(),
    // Solo activamos DevTools si no estamos en producción
    process.env.NODE_ENV !== 'production' ? vueDevTools() : []
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
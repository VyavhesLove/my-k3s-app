import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   define: {
//     'import.meta.env.PACKAGE_VERSION': JSON.stringify(new Date().toLocaleString()),
//   },
// })

const buildTime = new Date().toLocaleString('ru-RU', {
  timeZone: 'Asia/Yekaterinburg',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}).replace(',', '')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    css: true,
    setupFiles: './src/test/setup.js'
  },
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(
      buildTime
    ),
  },
})

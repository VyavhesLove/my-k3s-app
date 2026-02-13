import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // Загружаем переменные для текущего режима
  const env = loadEnv(mode, process.cwd(), '')
  
  const buildTime = new Date().toLocaleString('ru-RU', {
    timeZone: 'Asia/Yekaterinburg',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(',', '')

  console.log(`🔧 Vite mode: ${mode}`)
  console.log(`📦 Build time: ${buildTime}`)
  console.log(`🌍 API URL: ${env.VITE_API_URL || 'не задан'}`)

  return {
    plugins: [react()],
    define: {
      'import.meta.env.PACKAGE_VERSION': JSON.stringify(buildTime),
    },
    server: {
      host: true,
      port: 5173
    }
  }
})


/**
 * Логгер с поддержкой окружений Vite
 * 
 * - development: видно всё
 * - staging: видно info, warn, error
 * - production: только error
 */

const mode = import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development'
const logLevel = import.meta.env.VITE_LOG_LEVEL || 
  (mode === 'production' ? 'error' : 'debug')

const LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4
}

const currentLevel = LEVELS[logLevel] || LEVELS.debug

// Эмодзи для разных окружений
const envEmoji = {
  development: '🔧',
  staging: '🧪',
  production: '🚀'
}

const emoji = envEmoji[mode] || '📦'

export const logger = {
  debug: (...args) => {
    if (currentLevel <= LEVELS.debug) {
      console.debug(`${emoji} [${mode}] [DEBUG]`, ...args)
    }
  },
  
  log: (...args) => {
    if (currentLevel <= LEVELS.info) {
      console.log(`${emoji} [${mode}] [LOG]`, ...args)
    }
  },
  
  info: (...args) => {
    if (currentLevel <= LEVELS.info) {
      console.info(`${emoji} [${mode}] [INFO]`, ...args)
    }
  },
  
  warn: (...args) => {
    if (currentLevel <= LEVELS.warn) {
      console.warn(`${emoji} [${mode}] [WARN]`, ...args)
    }
  },
  
  error: (...args) => {
    if (currentLevel <= LEVELS.error) {
      console.error(`${emoji} [${mode}] [ERROR]`, ...args)
    }
  },
  
  table: (...args) => {
    if (currentLevel <= LEVELS.debug) {
      console.table(...args)
    }
  }
}

export const isDevelopment = mode === 'development'
export const isStaging = mode === 'staging'
export const isProduction = mode === 'production'


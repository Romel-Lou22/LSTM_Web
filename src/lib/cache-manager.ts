import { CacheEntry } from './utils'

/**
 * Sistema de cache en memoria para CropSense
 * Maneja el almacenamiento temporal de datos climáticos, de suelo y predicciones ML
 */
class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Limpiar cache cada 5 minutos
    this.startCleanupInterval()
  }

  /**
   * Almacena un valor en el cache con TTL
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    }
    
    this.cache.set(key, entry)
  }

  /**
   * Obtiene un valor del cache si no ha expirado
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    const now = Date.now()
    const isExpired = (now - entry.timestamp) > entry.ttl

    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Verifica si existe un key válido en el cache
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Elimina un key del cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Limpia todo el cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    for (const [, entry] of this.cache) {
      const isExpired = (now - entry.timestamp) > entry.ttl
      if (isExpired) {
        expiredEntries++
      } else {
        validEntries++
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * Limpia entradas expiradas del cache
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache) {
      const isExpired = (now - entry.timestamp) > entry.ttl
      if (isExpired) {
        this.cache.delete(key)
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * Inicia el proceso de limpieza automática
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    this.cleanupInterval = setInterval(() => {
      const cleaned = this.cleanup()
      if (cleaned > 0) {
        console.log(`[Cache] Limpiadas ${cleaned} entradas expiradas`)
      }
    }, 5 * 60 * 1000) // 5 minutos
  }

  /**
   * Detiene la limpieza automática
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Instancia singleton del cache
const cacheManager = new InMemoryCache()

// Keys predefinidas para el cache
export const CACHE_KEYS = {
  WEATHER_DATA: 'weather:current',
  WEATHER_FORECAST: 'weather:forecast',
  SOIL_DATA: 'soil:current',
  ML_WEATHER_PREDICTION: 'ml:weather',
  ML_SOIL_PREDICTION: 'ml:soil',
  OPENWEATHER_RAW: 'api:openweather',
  HUGGINGFACE_STATUS: 'api:huggingface:status'
} as const

// TTL predefinidos (en milisegundos)
export const CACHE_TTL = {
  WEATHER: 10 * 60 * 1000,    // 10 minutos
  SOIL: 30 * 60 * 1000,       // 30 minutos
  ML_PREDICTIONS: 60 * 60 * 1000, // 1 hora
  API_STATUS: 5 * 60 * 1000   // 5 minutos
} as const

/**
 * Funciones helper para operaciones comunes del cache
 */
export const cacheHelpers = {
  /**
   * Almacena datos meteorológicos
   */
  setWeatherData: (data: any) => {
    cacheManager.set(CACHE_KEYS.WEATHER_DATA, data, CACHE_TTL.WEATHER)
  },

  /**
   * Obtiene datos meteorológicos
   */
  getWeatherData: () => {
    return cacheManager.get(CACHE_KEYS.WEATHER_DATA)
  },

  /**
   * Almacena datos de suelo
   */
  setSoilData: (data: any) => {
    cacheManager.set(CACHE_KEYS.SOIL_DATA, data, CACHE_TTL.SOIL)
  },

  /**
   * Obtiene datos de suelo
   */
  getSoilData: () => {
    return cacheManager.get(CACHE_KEYS.SOIL_DATA)
  },

  /**
   * Almacena predicciones ML del clima
   */
  setMLWeatherPrediction: (data: any) => {
    cacheManager.set(CACHE_KEYS.ML_WEATHER_PREDICTION, data, CACHE_TTL.ML_PREDICTIONS)
  },

  /**
   * Obtiene predicciones ML del clima
   */
  getMLWeatherPrediction: () => {
    return cacheManager.get(CACHE_KEYS.ML_WEATHER_PREDICTION)
  },

  /**
   * Almacena predicciones ML del suelo
   */
  setMLSoilPrediction: (data: any) => {
    cacheManager.set(CACHE_KEYS.ML_SOIL_PREDICTION, data, CACHE_TTL.ML_PREDICTIONS)
  },

  /**
   * Obtiene predicciones ML del suelo
   */
  getMLSoilPrediction: () => {
    return cacheManager.get(CACHE_KEYS.ML_SOIL_PREDICTION)
  },

  /**
   * Verifica si hay datos en cache para evitar API calls innecesarios
   */
  hasValidWeatherData: () => {
    return cacheManager.has(CACHE_KEYS.WEATHER_DATA)
  },

  /**
   * Verifica si hay datos de suelo válidos
   */
  hasValidSoilData: () => {
    return cacheManager.has(CACHE_KEYS.SOIL_DATA)
  },

  /**
   * Limpia todo el cache relacionado con un tipo de datos
   */
  clearWeatherCache: () => {
    cacheManager.delete(CACHE_KEYS.WEATHER_DATA)
    cacheManager.delete(CACHE_KEYS.WEATHER_FORECAST)
    cacheManager.delete(CACHE_KEYS.OPENWEATHER_RAW)
  },

  clearSoilCache: () => {
    cacheManager.delete(CACHE_KEYS.SOIL_DATA)
  },

  clearMLCache: () => {
    cacheManager.delete(CACHE_KEYS.ML_WEATHER_PREDICTION)
    cacheManager.delete(CACHE_KEYS.ML_SOIL_PREDICTION)
  }
}

/**
 * Decorador para funciones que usan cache automático
 */
export function withCache<T extends any[], R>(
  cacheKey: string,
  ttl: number,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    // Generar key único basado en argumentos
    const argsHash = JSON.stringify(args)
    const fullKey = `${cacheKey}:${argsHash}`

    // Intentar obtener del cache primero
    const cached = cacheManager.get<R>(fullKey)
    if (cached !== null) {
      console.log(`[Cache HIT] ${fullKey}`)
      return cached
    }

    // Ejecutar función y cachear resultado
    console.log(`[Cache MISS] ${fullKey}`)
    const result = await fn(...args)
    cacheManager.set(fullKey, result, ttl)
    
    return result
  }
}

/**
 * Middleware para logging de operaciones de cache
 */
export const cacheLogger = {
  logStats: () => {
    const stats = cacheManager.getStats()
    console.log('[Cache Stats]', {
      total: stats.totalEntries,
      valid: stats.validEntries,
      expired: stats.expiredEntries,
      keys: stats.keys.slice(0, 5) // Solo primeras 5 keys
    })
  },

  logHit: (key: string) => {
    console.log(`[Cache HIT] ${key}`)
  },

  logMiss: (key: string) => {
    console.log(`[Cache MISS] ${key}`)
  },

  logSet: (key: string, ttl: number) => {
    console.log(`[Cache SET] ${key} (TTL: ${ttl}ms)`)
  }
}

export default cacheManager
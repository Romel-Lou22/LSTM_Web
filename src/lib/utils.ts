import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Tipos para el sistema de cache
export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// Resto de tipos del proyecto...
export interface WeatherData {
  current: {
    temperature: number
    humidity: number
    description: string
    windSpeed?: number
    pressure?: number
  }
  prediction: {
    next_temperature: number
    next_humidity: number
    trend: 'ascending' | 'descending' | 'stable'
    confidence: number
  }
  alerts: string[]
  forecast: Array<{
    time: string
    temperature: string
    humidity: string
    description: string
  }>
}

export interface SoilData {
  current: {
    pH: number
    nitrogen: number
    phosphorus: number
    potassium: number
    organic_matter?: number
    moisture?: number
  }
  prediction: {
    pH: number
    nitrogen: number
    phosphorus: number
    potassium: number
    confidence: number
  }
  alerts: string[]
  recommendations: string[]
  nutrient_levels: {
    pH: 'low' | 'optimal' | 'high'
    nitrogen: 'low' | 'optimal' | 'high'
    phosphorus: 'low' | 'optimal' | 'high'
    potassium: 'low' | 'optimal' | 'high'
  }
}

// Utilidades para ML
export interface MLInputData {
  climate: number[]
  soil: number[]
}

export interface MLPrediction {
  values: number[]
  confidence: number
  timestamp: number
}
import { NextRequest, NextResponse } from 'next/server';
import { 
  predictWeatherConditions, 
  prepareWeatherDataForML 
} from '@/lib/ml-integration';
import { WeatherData } from '@/lib/utils';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const LATITUDE = process.env.NEXT_PUBLIC_LATITUDE;
const LONGITUDE = process.env.NEXT_PUBLIC_LONGITUDE;

// Tipo para lecturas históricas individuales
interface WeatherReading {
  temperature: number;
  humidity: number;
  timestamp: string;
}

interface OpenWeatherResponse {
  main: {
    temp: number;
    humidity: number;
    feels_like: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  dt: number;
}

// ✅ FUNCIÓN AUXILIAR PARA FORMATEAR DECIMALES
function formatWeatherValue(value: number, decimals: number = 1): number {
  return parseFloat(value.toFixed(decimals));
}

// ✅ FUNCIÓN AUXILIAR PARA FORMATEAR CONFIANZA (0-100%)
function formatConfidence(value: number): number {
  // Si el valor es mayor a 1, asumimos que ya está en porcentaje
  if (value > 1) {
    // Si es mayor a 100, hay un error - limitamos a 100%
    return Math.min(Math.round(value), 100);
  }
  // Si es menor o igual a 1, asumimos que es decimal (0-1)
  return Math.round(value * 100);
}

export async function GET(request: NextRequest) {
  try {
    // 1. Obtener datos actuales de OpenWeatherMap
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${LATITUDE}&lon=${LONGITUDE}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    
    const currentResponse = await fetch(currentWeatherUrl);
    
    if (!currentResponse.ok) {
      throw new Error(`OpenWeatherMap API error: ${currentResponse.status}`);
    }

    const currentData: OpenWeatherResponse = await currentResponse.json();

    // 2. Obtener datos históricos simulados (últimas 24 horas)
    const weatherHistory = generateSimulatedHistory(currentData);

    // 3. Formatear datos para el modelo LSTM (48 valores)
    const mlInputData = prepareWeatherDataForML(weatherHistory);

    // 4. Enviar al modelo de Hugging Face y obtener predicción
    const prediction = await predictWeatherConditions(mlInputData);

    // 5. Preparar respuesta completa con valores formateados
    const response = {
      current: {
        temperature: formatWeatherValue(currentData.main.temp, 1), // ✅ 1 decimal
        humidity: Math.round(currentData.main.humidity), // ✅ Sin decimales
        feels_like: formatWeatherValue(currentData.main.feels_like, 1), // ✅ 1 decimal
        pressure: Math.round(currentData.main.pressure), // ✅ Sin decimales
        description: currentData.weather[0]?.description || "Sin descripción",
        condition: currentData.weather[0]?.main || "Clear",
        icon: currentData.weather[0]?.icon || "01d",
        wind_speed: formatWeatherValue(currentData.wind.speed, 1), // ✅ 1 decimal
        timestamp: new Date().toISOString()
      },
      prediction: {
        // ✅ AQUÍ ESTÁ EL FIX PRINCIPAL - Formatear las predicciones del ML
        next_temperature: formatWeatherValue(prediction.next_temperature, 1), // 7.8°C en lugar de 7.76656909557067°C
        next_humidity: Math.round(prediction.next_humidity), // 96% en lugar de 95.74339021569506%
        trend: prediction.trend,
        // ✅ FIX PARA CONFIANZA - Usar función especializada
        confidence: formatConfidence(prediction.confidence)
      },
      alerts: generateWeatherAlerts(currentData, prediction),
      forecast: generateSimpleForecast(prediction, currentData.weather[0]?.main || "Clear")
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error en API de clima:', error);
    
    // ✅ Respuesta de fallback con datos simulados formateados
    const fallbackResponse = {
      current: {
        temperature: 25,
        humidity: 65,
        feels_like: 26,
        pressure: 1013,
        description: "datos simulados",
        condition: "Clear",
        icon: "01d",
        wind_speed: 10,
        timestamp: new Date().toISOString()
      },
      prediction: {
        next_temperature: 26,
        next_humidity: 63,
        trend: "stable" as const,
        confidence: 50 // ✅ Cambiar de 0.5 a 50 para mostrar como porcentaje
      },
      alerts: ["Error al obtener datos reales - usando simulación"],
      forecast: [
        { time: "Mañana", temperature: "26°C", condition: "Clear" },
        { time: "Miércoles", temperature: "24°C", condition: "Clouds" },
        { time: "Jueves", temperature: "25°C", condition: "Clear" }
      ]
    };

    return NextResponse.json(fallbackResponse, { status: 206 }); // Partial content
  }
}

/**
 * Genera historial simulado de las últimas 24 horas
 * basado en el clima actual
 */
function generateSimulatedHistory(currentWeather: OpenWeatherResponse): WeatherReading[] {
  const history: WeatherReading[] = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const hourAgo = new Date(now.getTime() - (i * 60 * 60 * 1000));
    
    // Variaciones realistas basadas en la hora del día
    const hourlyTempVariation = Math.sin((24 - i) * Math.PI / 12) * 3; // Ciclo diario
    const hourlyHumidityVariation = Math.cos((24 - i) * Math.PI / 12) * 8;
    
    history.push({
      temperature: formatWeatherValue(currentWeather.main.temp + hourlyTempVariation + (Math.random() - 0.5) * 2, 1), // ✅ Formatear historial también
      humidity: Math.round(currentWeather.main.humidity + hourlyHumidityVariation + (Math.random() - 0.5) * 5), // ✅ Sin decimales
      timestamp: hourAgo.toISOString()
    });
  }
  
  return history;
}

/**
 * Genera alertas climáticas basadas en condiciones actuales y predicciones
 */
function generateWeatherAlerts(current: OpenWeatherResponse, prediction: {
  next_temperature: number;
  next_humidity: number;
  trend: 'ascending' | 'descending' | 'stable';
  confidence: number;
}): string[] {
  const alerts: string[] = [];
  
  // Alertas por temperatura
  if (current.main.temp > 30) {
    alerts.push("🌡️ Temperatura alta - Considerar riego adicional");
  }
  if (current.main.temp < 15) {
    alerts.push("❄️ Temperatura baja - Riesgo de helada");
  }
  
  // Alertas por humedad
  if (current.main.humidity > 80) {
    alerts.push("💧 Humedad alta - Riesgo de enfermedades fúngicas");
  }
  if (current.main.humidity < 40) {
    alerts.push("🏜️ Humedad baja - Estrés hídrico en plantas");
  }
  
  // Alertas por tendencia
  if (prediction.trend === 'ascending' && prediction.next_temperature > 32) {
    alerts.push("📈 Tendencia al calor - Planificar protección solar");
  }
  
  return alerts;
}

/**
 * ✅ FUNCIÓN MEJORADA: Genera pronóstico de 3 días con condiciones del clima
 */
function generateSimpleForecast(prediction: {
  next_temperature: number;
  next_humidity: number;
  trend: 'ascending' | 'descending' | 'stable';
  confidence: number;
}, baseCondition: string) {
  const days = ['Mañana', 'Miércoles', 'Jueves'];
  const forecast = [];
  
  // ✅ Condiciones posibles del clima para variedad
  const weatherConditions = ['Clear', 'Clouds', 'Rain', 'Drizzle'];
  
  for (let i = 0; i < 3; i++) {
    const tempVariation = (Math.random() - 0.5) * 4;
    const predictedTemp = Math.round(prediction.next_temperature + tempVariation); // ✅ Redondear temperatura del pronóstico
    
    // ✅ Lógica inteligente para determinar condición del clima
    let condition = baseCondition; // Usar condición actual como base
    
    // Cambiar condición basado en temperatura y humedad
    if (predictedTemp > 30) {
      condition = Math.random() > 0.7 ? 'Clear' : 'Clouds'; // Más sol cuando hace calor
    } else if (predictedTemp < 20) {
      condition = Math.random() > 0.5 ? 'Clouds' : 'Rain'; // Más nubes/lluvia cuando hace frío
    } else {
      // Temperatura normal - variación aleatoria pero realista
      const rand = Math.random();
      if (rand > 0.6) condition = 'Clear';
      else if (rand > 0.3) condition = 'Clouds';
      else condition = baseCondition; // Mantener condición actual
    }
    
    forecast.push({
      time: days[i],
      temperature: `${predictedTemp}°C`, // ✅ Ya está redondeado
      condition: condition // ✅ Campo condition para los iconos
    });
  }
  
  return forecast;
}

/**
 * ✅ FUNCIÓN: Selecciona condición del clima basada en parámetros
 */
function getWeatherConditionByTemperature(temp: number, humidity: number): string {
  // Lógica simple pero realista
  if (temp > 30 && humidity < 50) return 'Clear';      // Calor seco = Sol
  if (temp < 15) return 'Clouds';                      // Frío = Nublado
  if (humidity > 80) return 'Rain';                    // Mucha humedad = Lluvia
  if (humidity > 60) return 'Clouds';                  // Humedad media = Nublado
  return 'Clear';                                      // Por defecto = Sol
}
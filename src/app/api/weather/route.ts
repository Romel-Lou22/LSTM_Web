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

    // 5. Preparar respuesta completa
    const response = {
      current: {
        temperature: currentData.main.temp,
        humidity: currentData.main.humidity,
        feels_like: currentData.main.feels_like,
        pressure: currentData.main.pressure,
        description: currentData.weather[0]?.description || "Sin descripción",
        condition: currentData.weather[0]?.main || "Clear",
        icon: currentData.weather[0]?.icon || "01d",
        wind_speed: currentData.wind.speed,
        timestamp: new Date().toISOString()
      },
      prediction: {
        next_temperature: prediction.next_temperature,
        next_humidity: prediction.next_humidity,
        trend: prediction.trend,
        confidence: prediction.confidence
      },
      alerts: generateWeatherAlerts(currentData, prediction),
      forecast: generateSimpleForecast(prediction, currentData.weather[0]?.main || "Clear")
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error en API de clima:', error);
    
    // Respuesta de fallback con datos simulados
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
        confidence: 0.5
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
      temperature: currentWeather.main.temp + hourlyTempVariation + (Math.random() - 0.5) * 2,
      humidity: currentWeather.main.humidity + hourlyHumidityVariation + (Math.random() - 0.5) * 5,
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
    const predictedTemp = Math.round(prediction.next_temperature + tempVariation);
    
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
      temperature: `${predictedTemp}°C`, // ✅ Cambié de 'temp' a 'temperature' para consistencia
      condition: condition // ✅ AGREGADO: Campo condition para los iconos
    });
  }
  
  return forecast;
}

/**
 * ✅ NUEVA FUNCIÓN: Selecciona condición del clima basada en parámetros
 */
function getWeatherConditionByTemperature(temp: number, humidity: number): string {
  // Lógica simple pero realista
  if (temp > 30 && humidity < 50) return 'Clear';      // Calor seco = Sol
  if (temp < 15) return 'Clouds';                      // Frío = Nublado
  if (humidity > 80) return 'Rain';                    // Mucha humedad = Lluvia
  if (humidity > 60) return 'Clouds';                  // Humedad media = Nublado
  return 'Clear';                                      // Por defecto = Sol
}
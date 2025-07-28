// src/lib/ml-integration.ts

/**
 * Integración con modelos LSTM de Hugging Face para CropSense
 * Maneja predicciones climáticas y de suelo
 */

const HUGGINGFACE_URL = process.env.NEXT_PUBLIC_HUGGINGFACE_SPACE_URL || 'https://roca22-api-predicciones-agricolas.hf.space';

interface MLPredictionResponse {
  predictions: number[];
  confidence: number;
  status: string;
}

interface WeatherPrediction {
  next_temperature: number;
  next_humidity: number;
  trend: 'ascending' | 'descending' | 'stable';
  confidence: number;
}

interface SoilPrediction {
  pH: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  confidence: number;
}

/**
 * Predice condiciones climáticas usando modelo LSTM
 * @param inputData Array de 48 valores (24 timesteps × 2 features: temp, humidity)
 */
export async function predictWeatherConditions(inputData: number[]): Promise<WeatherPrediction> {
  try {
    console.log('[ML] Iniciando predicción climática...');
    
    if (inputData.length !== 48) {
      throw new Error(`Input inválido: esperados 48 valores, recibidos ${inputData.length}`);
    }

    const response = await fetch(`${HUGGINGFACE_URL}/predict/clima`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: inputData,
        parameters: {
          return_confidence: true
        }
      }),
      signal: AbortSignal.timeout(15000) // 15 segundos timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: MLPredictionResponse = await response.json();
    
    if (!result.predictions || result.predictions.length < 2) {
      throw new Error('Respuesta ML inválida');
    }

    // Interpretar predicciones
    const [nextTemp, nextHumidity] = result.predictions;
    const currentTemp = inputData[inputData.length - 2]; // Penúltimo valor
    const currentHumidity = inputData[inputData.length - 1]; // Último valor

    // Determinar tendencia
    let trend: 'ascending' | 'descending' | 'stable' = 'stable';
    const tempDiff = nextTemp - currentTemp;
    if (Math.abs(tempDiff) > 0.5) {
      trend = tempDiff > 0 ? 'ascending' : 'descending';
    }

    console.log('[ML] Predicción climática completada');

    return {
      next_temperature: Number(nextTemp.toFixed(1)),
      next_humidity: Number(nextHumidity.toFixed(1)),
      trend,
      confidence: result.confidence || 0.8
    };

  } catch (error) {
    console.error('[ML] Error en predicción climática:', error);
    
    // Fallback con predicción simple
    const currentTemp = inputData[inputData.length - 2] || 25;
    const currentHumidity = inputData[inputData.length - 1] || 70;
    
    return {
      next_temperature: currentTemp + (Math.random() - 0.5) * 2,
      next_humidity: currentHumidity + (Math.random() - 0.5) * 5,
      trend: 'stable',
      confidence: 0.6
    };
  }
}

/**
 * Predice condiciones del suelo usando modelo LSTM
 * @param inputData Array de 96 valores (24 timesteps × 4 features: pH, N, P, K)
 */
export async function predictSoilConditions(inputData: number[]): Promise<SoilPrediction> {
  try {
    console.log('[ML] Iniciando predicción de suelo...');
    
    if (inputData.length !== 96) {
      throw new Error(`Input inválido: esperados 96 valores, recibidos ${inputData.length}`);
    }

    const response = await fetch(`${HUGGINGFACE_URL}/predict/suelo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: inputData,
        parameters: {
          return_confidence: true
        }
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: MLPredictionResponse = await response.json();
    
    if (!result.predictions || result.predictions.length < 4) {
      throw new Error('Respuesta ML inválida para suelo');
    }

    const [pH, nitrogen, phosphorus, potassium] = result.predictions;

    console.log('[ML] Predicción de suelo completada');

    return {
      pH: Number(pH.toFixed(1)),
      nitrogen: Number(nitrogen.toFixed(1)),
      phosphorus: Number(phosphorus.toFixed(1)),
      potassium: Number(potassium.toFixed(1)),
      confidence: result.confidence || 0.75
    };

  } catch (error) {
    console.error('[ML] Error en predicción de suelo:', error);
    
    // Fallback con predicción simple basada en últimos valores
    const lastIndex = inputData.length - 4;
    const currentPH = inputData[lastIndex] || 7.0;
    const currentN = inputData[lastIndex + 1] || 45;
    const currentP = inputData[lastIndex + 2] || 25;
    const currentK = inputData[lastIndex + 3] || 35;
    
    return {
      pH: currentPH + (Math.random() - 0.5) * 0.2,
      nitrogen: currentN + (Math.random() - 0.5) * 3,
      phosphorus: currentP + (Math.random() - 0.5) * 2,
      potassium: currentK + (Math.random() - 0.5) * 2,
      confidence: 0.6
    };
  }
}

/**
 * Verifica el estado de los modelos en Hugging Face
 */
export async function checkMLModelsStatus(): Promise<{
  clima: boolean;
  suelo: boolean;
  lastCheck: string;
}> {
  try {
    const [climaResponse, sueloResponse] = await Promise.allSettled([
      fetch(`${HUGGINGFACE_URL}/health/clima`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      }),
      fetch(`${HUGGINGFACE_URL}/health/suelo`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
    ]);

    return {
      clima: climaResponse.status === 'fulfilled' && climaResponse.value.ok,
      suelo: sueloResponse.status === 'fulfilled' && sueloResponse.value.ok,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    console.error('[ML] Error verificando estado de modelos:', error);
    return {
      clima: false,
      suelo: false,
      lastCheck: new Date().toISOString()
    };
  }
}

/**
 * Prepara datos climáticos para el modelo LSTM del clima
 */
export function prepareWeatherDataForML(weatherHistory: any[]): number[] {
  const inputData: number[] = [];
  
  // Asegurar que tenemos exactamente 24 timesteps
  const timesteps = weatherHistory.slice(-24);
  
  timesteps.forEach(reading => {
    // Orden: temperatura, humedad
    inputData.push(
      Number(reading.temperature) || 25,
      Number(reading.humidity) || 70
    );
  });

  // Rellenar si faltan datos
  while (inputData.length < 48) {
    inputData.push(25, 70); // Valores por defecto
  }

  return inputData.slice(0, 48); // Exactamente 48 valores
}

/**
 * Prepara datos de suelo para el modelo LSTM del suelo
 */
export function prepareSoilDataForML(soilHistory: any[]): number[] {
  const inputData: number[] = [];
  
  // Asegurar que tenemos exactamente 24 timesteps
  const timesteps = soilHistory.slice(-24);
  
  timesteps.forEach(reading => {
    // Orden: pH, N, P, K
    inputData.push(
      Number(reading.pH) || 7.0,
      Number(reading.nitrogen) || 45,
      Number(reading.phosphorus) || 25,
      Number(reading.potassium) || 35
    );
  });

  // Rellenar si faltan datos
  while (inputData.length < 96) {
    inputData.push(7.0, 45, 25, 35); // Valores por defecto
  }

  return inputData.slice(0, 96); // Exactamente 96 valores
}

/**
 * Función de utilidad para probar la conectividad con Hugging Face
 */
export async function testHuggingFaceConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${HUGGINGFACE_URL}/`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    return response.ok;
  } catch (error) {
    console.error('[ML] Error de conectividad:', error);
    return false;
  }
}
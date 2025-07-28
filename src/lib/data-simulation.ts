// src/lib/data-simulation.ts

interface WeatherInput {
  temperature: number;
  humidity: number;
}

// Tipo específico para los cálculos internos del simulador
interface NPKReading {
  pH: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  timestamp: string;
}

export class NPKDataSimulator {
  private lastValues: NPKReading | null = null;
  private readonly baseValues = {
    pH: 7.2,
    nitrogen: 45.3,
    phosphorus: 23.1,
    potassium: 12.8
  };

  /**
   * Genera datos NPK realistas basados en condiciones climáticas
   */
  generateNPKTimeSeries(weatherData: WeatherInput[]): number[] {
    const timeSeries: number[] = [];
    
    weatherData.forEach((weather, index) => {
      const soilData = this.calculateNPKFromWeather(weather, index);
      
      // Agregar en orden: pH, N, P, K
      timeSeries.push(
        soilData.pH,
        soilData.nitrogen,
        soilData.phosphorus,
        soilData.potassium
      );
    });

    return timeSeries;
  }

  /**
   * Calcula valores NPK basados en temperatura y humedad
   */
  private calculateNPKFromWeather(weather: WeatherInput, timeIndex: number): NPKReading {
    const { temperature, humidity } = weather;
    
    // Factores de influencia climática
    const tempFactor = (temperature - 25) / 10; // Normalizado
    const humidityFactor = (humidity - 60) / 20; // Normalizado
    
    // Variaciones temporales (simulan ciclos naturales)
    const temporalVariation = Math.sin(timeIndex * 0.1) * 0.1;
    
    // Cálculos realistas basados en agronomía
    const pH = this.constrainValue(
      this.baseValues.pH + 
      (humidityFactor * 0.3) + 
      (tempFactor * 0.1) + 
      temporalVariation +
      (Math.random() - 0.5) * 0.2,
      5.5, 8.5
    );

    const nitrogen = this.constrainValue(
      this.baseValues.nitrogen + 
      (humidityFactor * 5) + 
      (tempFactor * -2) + 
      (Math.random() - 0.5) * 3,
      20, 80
    );

    const phosphorus = this.constrainValue(
      this.baseValues.phosphorus + 
      (tempFactor * 1.5) + 
      (Math.random() - 0.5) * 2,
      10, 40
    );

    const potassium = this.constrainValue(
      this.baseValues.potassium + 
      (humidityFactor * 2) + 
      (tempFactor * 0.5) + 
      (Math.random() - 0.5) * 1.5,
      8, 25
    );

    return {
      pH: Number(pH.toFixed(1)),
      nitrogen: Number(nitrogen.toFixed(1)),
      phosphorus: Number(phosphorus.toFixed(1)),
      potassium: Number(potassium.toFixed(1)),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Limita valores dentro de rangos agronómicos válidos
   */
  private constrainValue(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Genera 24 timesteps de datos simulados
   */
  generate24HourNPKData(currentWeather: WeatherInput): number[] {
    // Simular variaciones durante 24 horas
    const weatherTimeSeries: WeatherInput[] = [];
    
    for (let i = 0; i < 24; i++) {
      // Pequeñas variaciones horarias realistas
      const tempVariation = Math.sin(i * Math.PI / 12) * 2; // Ciclo diario
      const humidityVariation = Math.cos(i * Math.PI / 12) * 5;
      
      weatherTimeSeries.push({
        temperature: currentWeather.temperature + tempVariation + (Math.random() - 0.5),
        humidity: currentWeather.humidity + humidityVariation + (Math.random() - 0.5) * 2
      });
    }

    return this.generateNPKTimeSeries(weatherTimeSeries);
  }
}

// Instancia singleton para reutilizar
export const npkSimulator = new NPKDataSimulator();

/**
 * Función para generar datos de suelo usando el simulador existente
 * Compatible con la API de soil-data
 */
export async function generateSoilData() {
  try {
    // Simular condiciones climáticas actuales para Latacunga
    const currentWeather = {
      temperature: 22 + Math.random() * 8, // 22-30°C típico de la sierra
      humidity: 65 + Math.random() * 25     // 65-90% humedad
    };

    // Generar 24 timesteps de datos NPK
    const historyForML = npkSimulator.generate24HourNPKData(currentWeather);
    
    // Extraer el último timestep como datos actuales
    const lastIndex = historyForML.length - 4;
    const current = {
      pH: historyForML[lastIndex],
      nitrogen: historyForML[lastIndex + 1],
      phosphorus: historyForML[lastIndex + 2],
      potassium: historyForML[lastIndex + 3],
      organic_matter: 3.2 + (Math.random() - 0.5) * 0.8, // 2.8-3.6%
      moisture: currentWeather.humidity * 0.85 + (Math.random() - 0.5) * 10
    };

    return {
      current,
      historyForML
    };

  } catch (error) {
    console.error('[Data Simulation] Error generando datos de suelo:', error);
    
    // Fallback
    return {
      current: {
        pH: 7.2,
        nitrogen: 45.3,
        phosphorus: 23.1,
        potassium: 12.8,
        organic_matter: 3.2,
        moisture: 65
      },
      historyForML: Array(96).fill(0).map((_, i) => {
        const cycle = i % 4;
        switch(cycle) {
          case 0: return 7.2;   // pH
          case 1: return 45.3;  // N
          case 2: return 23.1;  // P
          case 3: return 12.8;  // K
          default: return 0;
        }
      })
    };
  }
}
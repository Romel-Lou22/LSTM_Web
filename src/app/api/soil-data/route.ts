import { NextResponse } from 'next/server';
import { generateSoilData } from '@/lib/data-simulation';
import { predictSoilConditions } from '@/lib/ml-integration';
import { cacheHelpers } from '@/lib/cache-manager';

// ✅ PASO 1: Interfaz actualizada con trend_analysis
interface SoilDataResponse {
  current: {
    pH: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    organic_matter: number;
    moisture: number;
  };
  prediction: {
    pH: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    confidence: number;
    // ✅ AGREGADO: trend_analysis que espera el frontend
    trend_analysis: {
      pH: 'ascending' | 'descending' | 'stable';
      nitrogen: 'ascending' | 'descending' | 'stable';
      phosphorus: 'ascending' | 'descending' | 'stable';
      potassium: 'ascending' | 'descending' | 'stable';
    };
  };
  alerts: string[];
  recommendations: string[];
  nutrient_levels: {
    pH: 'low' | 'optimal' | 'high';
    nitrogen: 'low' | 'optimal' | 'high';
    phosphorus: 'low' | 'optimal' | 'high';
    potassium: 'low' | 'optimal' | 'high';
  };
}

export async function GET() {
  try {
    // Verificar cache primero
    const cachedData = cacheHelpers.getSoilData();
    if (cachedData) {
      console.log('[Soil API] Datos obtenidos del cache');
      return NextResponse.json(cachedData);
    }

    console.log('[Soil API] Generando nuevos datos de suelo...');

    // Generar datos de suelo simulados
    const soilData = await generateSoilData();
    
    // ✅ PASO 2: Hacer predicción con modelo ML + análisis de tendencias
    let prediction;
    try {
      const mlPrediction = await predictSoilConditions(soilData.historyForML);
      
      // ✅ PASO 3: Agregar análisis de tendencias
      const trend_analysis = {
        pH: determineTrend(soilData.current.pH, mlPrediction.pH),
        nitrogen: determineTrend(soilData.current.nitrogen, mlPrediction.nitrogen),
        phosphorus: determineTrend(soilData.current.phosphorus, mlPrediction.phosphorus),
        potassium: determineTrend(soilData.current.potassium, mlPrediction.potassium)
      };
      
      prediction = {
        ...mlPrediction,
        trend_analysis
      };
      
    } catch (mlError) {
      console.error('[Soil API] Error en predicción ML:', mlError);
      
      // ✅ PASO 4: Fallback mejorado con trend_analysis
      const predictedPH = soilData.current.pH + (Math.random() - 0.5) * 0.2;
      const predictedN = soilData.current.nitrogen + (Math.random() - 0.5) * 5;
      const predictedP = soilData.current.phosphorus + (Math.random() - 0.5) * 3;
      const predictedK = soilData.current.potassium + (Math.random() - 0.5) * 4;
      
      prediction = {
        pH: predictedPH,
        nitrogen: predictedN,
        phosphorus: predictedP,
        potassium: predictedK,
        confidence: 0.7,
        trend_analysis: {
          pH: determineTrend(soilData.current.pH, predictedPH),
          nitrogen: determineTrend(soilData.current.nitrogen, predictedN),
          phosphorus: determineTrend(soilData.current.phosphorus, predictedP),
          potassium: determineTrend(soilData.current.potassium, predictedK)
        }
      };
    }

    // Clasificar niveles de nutrientes
    const nutrient_levels = {
      pH: classifyPH(soilData.current.pH),
      nitrogen: classifyNutrient(soilData.current.nitrogen, [0, 50], [50, 100]),
      phosphorus: classifyNutrient(soilData.current.phosphorus, [0, 30], [30, 60]),
      potassium: classifyNutrient(soilData.current.potassium, [0, 40], [40, 80])
    };

    // Generar alertas y recomendaciones
    const alerts = generateSoilAlerts(soilData.current, nutrient_levels);
    const recommendations = generateSoilRecommendations(nutrient_levels, soilData.current);

    const response: SoilDataResponse = {
      current: soilData.current,
      prediction,
      alerts,
      recommendations,
      nutrient_levels
    };

    // Guardar en cache por 30 minutos
    cacheHelpers.setSoilData(response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Soil API] Error:', error);
    
    // ✅ PASO 5: Respuesta de fallback completa con trend_analysis
    const fallbackResponse: SoilDataResponse = {
      current: {
        pH: 7.0,
        nitrogen: 45,
        phosphorus: 25,
        potassium: 35,
        organic_matter: 3.2,
        moisture: 65
      },
      prediction: {
        pH: 7.1,
        nitrogen: 46,
        phosphorus: 26,
        potassium: 36,
        confidence: 0.6,
        trend_analysis: {
          pH: 'ascending',
          nitrogen: 'ascending',
          phosphorus: 'ascending',
          potassium: 'ascending'
        }
      },
      alerts: ['⚠️ Datos simulados - Servicio en mantenimiento'],
      recommendations: ['🔧 Verificar conectividad de sensores'],
      nutrient_levels: {
        pH: 'optimal',
        nitrogen: 'optimal',
        phosphorus: 'optimal',
        potassium: 'low'
      }
    };

    return NextResponse.json(fallbackResponse);
  }
}

// ✅ NUEVA FUNCIÓN: Determinar tendencia entre valor actual y predicción
function determineTrend(current: number, predicted: number): 'ascending' | 'descending' | 'stable' {
  const diff = predicted - current;
  const threshold = Math.abs(current) * 0.05; // 5% de cambio mínimo
  
  if (diff > threshold) return 'ascending';
  if (diff < -threshold) return 'descending';
  return 'stable';
}

// Funciones helper existentes (sin cambios)
function classifyPH(pH: number): 'low' | 'optimal' | 'high' {
  if (pH < 6.0) return 'low';
  if (pH > 8.0) return 'high';
  return 'optimal';
}

function classifyNutrient(
  value: number, 
  lowRange: [number, number], 
  optimalRange: [number, number]
): 'low' | 'optimal' | 'high' {
  if (value < lowRange[1]) return 'low';
  if (value > optimalRange[1]) return 'high';
  return 'optimal';
}

function generateSoilAlerts(
  current: SoilDataResponse['current'], 
  levels: SoilDataResponse['nutrient_levels']
): string[] {
  const alerts: string[] = [];

  if (levels.pH === 'low') {
    alerts.push('🔴 pH bajo - Suelo muy ácido, considerar encalado');
  } else if (levels.pH === 'high') {
    alerts.push('🔴 pH alto - Suelo muy alcalino, verificar drenaje');
  }

  if (levels.nitrogen === 'low') {
    alerts.push('🟡 Deficiencia de Nitrógeno - Impacta crecimiento vegetativo');
  }

  if (levels.phosphorus === 'low') {
    alerts.push('🟡 Bajo Fósforo - Puede afectar desarrollo radicular');
  }

  if (levels.potassium === 'low') {
    alerts.push('🟡 Potasio insuficiente - Impacta resistencia al estrés');
  }

  if (current.moisture < 40) {
    alerts.push('🔵 Humedad baja - Considerar riego');
  }

  return alerts;
}

function generateSoilRecommendations(
  levels: SoilDataResponse['nutrient_levels'],
  current: SoilDataResponse['current']
): string[] {
  const recommendations: string[] = [];

  if (levels.nitrogen === 'low') {
    recommendations.push('🌱 Aplicar fertilizante nitrogenado (urea o sulfato de amonio)');
  }

  if (levels.phosphorus === 'low') {
    recommendations.push('🌿 Incorporar fosfato diamónico o roca fosfórica');
  }

  if (levels.potassium === 'low') {
    recommendations.push('🍃 Añadir cloruro o sulfato de potasio');
  }

  if (levels.pH === 'low') {
    recommendations.push('⚡ Aplicar cal agrícola para subir pH');
  }

  if (current.organic_matter < 3.0) {
    recommendations.push('🌾 Incrementar materia orgánica con compost');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Condiciones del suelo son óptimas, mantener programa actual');
  }

  return recommendations;
}
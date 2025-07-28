import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Sprout, 
  TestTube, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface SoilData {
  current: {
    pH: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    last_updated: string;
  };
  prediction: {
    pH: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    confidence: number;
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

const SoilWidget: React.FC = () => {
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchSoilData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/soil-data');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSoilData(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching soil data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoilData();
    
    // Auto-refresh cada 5 minutos
    const interval = setInterval(fetchSoilData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'optimal':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'low':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'optimal':
        return <CheckCircle className="h-4 w-4" />;
      case 'low':
        return <XCircle className="h-4 w-4" />;
      case 'high':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'ascending':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'descending':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getProgressBarColor = (level: string) => {
    switch (level) {
      case 'optimal':
        return 'bg-green-500';
      case 'low':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getNutrientValue = (nutrient: string, current: any) => {
    switch (nutrient) {
      case 'pH':
        return current.pH?.toFixed(1) || '0.0';
      case 'nitrogen':
        return current.nitrogen?.toFixed(1) || '0.0';
      case 'phosphorus':
        return current.phosphorus?.toFixed(1) || '0.0';
      case 'potassium':
        return current.potassium?.toFixed(1) || '0.0';
      default:
        return '0.0';
    }
  };

  const getNutrientUnit = (nutrient: string) => {
    switch (nutrient) {
      case 'pH':
        return '';
      default:
        return ' mg/kg';
    }
  };

  const getNutrientProgress = (nutrient: string, level: string) => {
    // Simulamos un porcentaje basado en el nivel
    switch (level) {
      case 'low':
        return 25;
      case 'optimal':
        return 75;
      case 'high':
        return 95;
      default:
        return 50;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Análisis de Suelo NPK
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-600">Analizando composición del suelo...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Análisis de Suelo NPK
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar datos del suelo: {error}
              <button 
                onClick={fetchSoilData}
                className="ml-2 text-blue-600 hover:text-blue-800 underline"
              >
                Reintentar
              </button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!soilData) {
    return null;
  }

  const nutrients = [
    { key: 'pH', name: 'pH', icon: '🧪' },
    { key: 'nitrogen', name: 'Nitrógeno (N)', icon: '🌿' },
    { key: 'phosphorus', name: 'Fósforo (P)', icon: '🌾' },
    { key: 'potassium', name: 'Potasio (K)', icon: '🌱' }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Análisis de Suelo NPK
          </div>
          <Badge variant="outline" className="text-xs">
            Actualizado: {lastUpdate.toLocaleTimeString()}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Niveles de Nutrientes */}
        <div className="grid grid-cols-1 gap-3">
          {nutrients.map((nutrient) => {
            const level = soilData.nutrient_levels[nutrient.key as keyof typeof soilData.nutrient_levels];
            const currentValue = getNutrientValue(nutrient.key, soilData.current);
            const trend = soilData.prediction?.trend_analysis?.[nutrient.key as keyof typeof soilData.prediction.trend_analysis];
            const progress = getNutrientProgress(nutrient.key, level);
            
            return (
              <div key={nutrient.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{nutrient.icon}</span>
                    <span className="text-sm font-medium">{nutrient.name}</span>
                    {getTrendIcon(trend)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {currentValue}{getNutrientUnit(nutrient.key)}
                    </span>
                    <Badge className={`text-xs ${getLevelColor(level)}`}>
                      {getLevelIcon(level)}
                      <span className="ml-1 capitalize">{level}</span>
                    </Badge>
                  </div>
                </div>
                
                {/* Barra de Progreso */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(level)}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Predicción IA */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-blue-800">
              Predicción IA - Próximas Horas
            </div>
            <Badge variant="outline" className="text-xs text-blue-600">
              Confianza: {Math.round(soilData.prediction.confidence * 100)}%
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-blue-600">pH:</span>
              <span className="ml-1 font-semibold">{soilData.prediction.pH.toFixed(1)}</span>
            </div>
            <div>
              <span className="text-blue-600">N:</span>
              <span className="ml-1 font-semibold">{soilData.prediction.nitrogen.toFixed(1)} mg/kg</span>
            </div>
            <div>
              <span className="text-blue-600">P:</span>
              <span className="ml-1 font-semibold">{soilData.prediction.phosphorus.toFixed(1)} mg/kg</span>
            </div>
            <div>
              <span className="text-blue-600">K:</span>
              <span className="ml-1 font-semibold">{soilData.prediction.potassium.toFixed(1)} mg/kg</span>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {soilData.alerts && soilData.alerts.length > 0 && (
          <div className="space-y-2">
            {soilData.alerts.map((alert, index) => (
              <Alert key={index} className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {alert}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Recomendaciones */}
        {soilData.recommendations && soilData.recommendations.length > 0 && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Sprout className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Recomendaciones</span>
            </div>
            <div className="space-y-1">
              {soilData.recommendations.map((recommendation, index) => (
                <div key={index} className="text-xs text-green-700 flex items-start gap-1">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SoilWidget;
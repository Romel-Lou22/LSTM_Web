import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Cloud, Sun, CloudRain, Thermometer, Droplets, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    description: string;
    condition: string;
  };
  prediction: {
    next_temperature: number;
    next_humidity: number;
    trend: 'ascending' | 'descending' | 'stable';
    confidence: number;
  };
  alerts: string[];
  forecast: Array<{
    time: string;
    temperature: string;
    condition: string;
  }>;
}

const WeatherWidget: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/weather');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setWeatherData(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching weather data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
    
    // Auto-refresh cada 5 minutos
    const interval = setInterval(fetchWeatherData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
      case 'sunny':
        return <Sun className="h-8 w-8 text-yellow-500" />;
      case 'clouds':
      case 'cloudy':
        return <Cloud className="h-8 w-8 text-gray-500" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      default:
        return <Cloud className="h-8 w-8 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'ascending':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'descending':
        return <TrendingDown className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp > 30) return 'text-red-600';
    if (temp > 25) return 'text-orange-500';
    if (temp > 20) return 'text-green-600';
    if (temp > 15) return 'text-blue-500';
    return 'text-blue-700';
  };

  const getHumidityColor = (humidity: number) => {
    if (humidity > 80) return 'text-blue-600';
    if (humidity > 60) return 'text-green-600';
    if (humidity > 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Condiciones Climáticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando datos climáticos...</span>
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
            <Thermometer className="h-5 w-5" />
            Condiciones Climáticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar datos climáticos: {error}
              <button 
                onClick={fetchWeatherData}
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

  if (!weatherData) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Condiciones Climáticas
          </div>
          <Badge variant="outline" className="text-xs">
            Actualizado: {lastUpdate.toLocaleTimeString()}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Condiciones Actuales */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getWeatherIcon(weatherData.current.condition)}
            <div>
              <div className={`text-3xl font-bold ${getTemperatureColor(weatherData.current.temperature)}`}>
                {weatherData.current.temperature}°C
              </div>
              <div className="text-sm text-gray-600">
                {weatherData.current.description}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span className={`font-semibold ${getHumidityColor(weatherData.current.humidity)}`}>
              {weatherData.current.humidity}%
            </span>
          </div>
        </div>

        {/* Predicción */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Predicción próxima hora</div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${getTemperatureColor(weatherData.prediction.next_temperature)}`}>
                  {weatherData.prediction.next_temperature}°C
                </span>
                {getTrendIcon(weatherData.prediction.trend)}
                <span className="text-sm text-gray-500">
                  Confianza: {Math.round(weatherData.prediction.confidence * 100)}%
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Humedad</div>
              <div className={`font-semibold ${getHumidityColor(weatherData.prediction.next_humidity)}`}>
                {weatherData.prediction.next_humidity}%
              </div>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {weatherData.alerts && weatherData.alerts.length > 0 && (
          <div className="space-y-2">
            {weatherData.alerts.map((alert, index) => (
              <Alert key={index} className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  {alert}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Pronóstico */}
        {weatherData.forecast && weatherData.forecast.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Pronóstico</div>
            <div className="grid grid-cols-3 gap-2">
              {weatherData.forecast.map((forecast, index) => (
                <div key={index} className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600 mb-1">{forecast.time}</div>
                  <div className="flex justify-center mb-1">
                    {getWeatherIcon(forecast.condition)}
                  </div>
                  <div className="text-sm font-semibold">{forecast.temperature}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
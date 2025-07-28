import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Thermometer,
  TestTube,
  Clock,
  RefreshCw
} from 'lucide-react';

interface WeatherData {
  alerts: string[];
}

interface SoilData {
  alerts: string[];
  recommendations: string[];
}

interface CombinedAlert {
  id: string;
  type: 'weather' | 'soil' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
  title: string;
  message: string;
  timestamp: Date;
  source: 'climate' | 'soil';
}

const AlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<CombinedAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchAlertsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch datos de ambas APIs en paralelo
      const [weatherResponse, soilResponse] = await Promise.all([
        fetch('/api/weather'),
        fetch('/api/soil-data')
      ]);

      if (!weatherResponse.ok || !soilResponse.ok) {
        throw new Error('Error al obtener datos de las APIs');
      }

      const weatherData: WeatherData = await weatherResponse.json();
      const soilData: SoilData = await soilResponse.json();

      // Combinar y procesar alertas
      const combinedAlerts = processCombinedAlerts(weatherData, soilData);
      setAlerts(combinedAlerts);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching alerts data:', err);
    } finally {
      setLoading(false);
    }
  };

  const processCombinedAlerts = (weatherData: WeatherData, soilData: SoilData): CombinedAlert[] => {
    const combinedAlerts: CombinedAlert[] = [];
    const now = new Date();

    // Procesar alertas climáticas
    weatherData.alerts?.forEach((alert, index) => {
      const priority = determineWeatherPriority(alert);
      combinedAlerts.push({
        id: `weather-${index}`,
        type: 'weather',
        priority,
        icon: <Thermometer className="h-4 w-4" />,
        title: 'Alerta Climática',
        message: alert,
        timestamp: now,
        source: 'climate'
      });
    });

    // Procesar alertas de suelo
    soilData.alerts?.forEach((alert, index) => {
      const priority = determineSoilPriority(alert);
      combinedAlerts.push({
        id: `soil-alert-${index}`,
        type: 'soil',
        priority,
        icon: <TestTube className="h-4 w-4" />,
        title: 'Alerta de Suelo',
        message: alert,
        timestamp: now,
        source: 'soil'
      });
    });

    // Procesar recomendaciones de suelo
    soilData.recommendations?.forEach((recommendation, index) => {
      combinedAlerts.push({
        id: `soil-rec-${index}`,
        type: 'recommendation',
        priority: 'medium',
        icon: <Info className="h-4 w-4" />,
        title: 'Recomendación Agronómica',
        message: recommendation,
        timestamp: now,
        source: 'soil'
      });
    });

    // Ordenar por prioridad y timestamp
    return combinedAlerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  };

  const determineWeatherPriority = (alert: string): 'high' | 'medium' | 'low' => {
    const lowerAlert = alert.toLowerCase();
    
    if (lowerAlert.includes('crítico') || lowerAlert.includes('extremo') || lowerAlert.includes('peligro')) {
      return 'high';
    }
    if (lowerAlert.includes('alta') || lowerAlert.includes('riego') || lowerAlert.includes('protección')) {
      return 'medium';
    }
    return 'low';
  };

  const determineSoilPriority = (alert: string): 'high' | 'medium' | 'low' => {
    const lowerAlert = alert.toLowerCase();
    
    if (lowerAlert.includes('crítico') || lowerAlert.includes('severo') || lowerAlert.includes('urgente')) {
      return 'high';
    }
    if (lowerAlert.includes('deficiencia') || lowerAlert.includes('bajo') || lowerAlert.includes('exceso')) {
      return 'medium';
    }
    return 'low';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-orange-200 bg-orange-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'climate':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'soil':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  useEffect(() => {
    fetchAlertsData();
    
    // Auto-refresh cada 5 minutos
    const interval = setInterval(fetchAlertsData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Centro de Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="ml-2 text-gray-600">Recopilando alertas...</span>
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
            <Bell className="h-5 w-5" />
            Centro de Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar alertas: {error}
              <button 
                onClick={fetchAlertsData}
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

  const highPriorityCount = alerts.filter(alert => alert.priority === 'high').length;
  const totalAlertsCount = alerts.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Centro de Alertas
            {highPriorityCount > 0 && (
              <Badge className="bg-red-100 text-red-800 border-red-200">
                {highPriorityCount} urgente{highPriorityCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {totalAlertsCount} alerta{totalAlertsCount !== 1 ? 's' : ''}
            </Badge>
            <button
              onClick={fetchAlertsData}
              className="p-1 hover:bg-gray-100 rounded"
              title="Actualizar alertas"
            >
              <RefreshCw className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
            <p className="text-gray-600">No hay alertas activas</p>
            <p className="text-sm text-gray-500">Todas las condiciones están óptimas</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <Alert key={alert.id} className={`${getPriorityColor(alert.priority)} border-l-4`}>
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center gap-1 mt-0.5">
                      {getPriorityIcon(alert.priority)}
                      {alert.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {alert.title}
                        </h4>
                        <Badge className={`text-xs ${getPriorityBadgeColor(alert.priority)}`}>
                          {alert.priority === 'high' ? 'Urgente' : 
                           alert.priority === 'medium' ? 'Medio' : 'Bajo'}
                        </Badge>
                        <Badge className={`text-xs ${getSourceBadgeColor(alert.source)}`}>
                          {alert.source === 'climate' ? 'Clima' : 'Suelo'}
                        </Badge>
                      </div>
                      
                      <AlertDescription className="text-sm text-gray-700">
                        {alert.message}
                      </AlertDescription>
                      
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Actualizado: {lastUpdate.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;
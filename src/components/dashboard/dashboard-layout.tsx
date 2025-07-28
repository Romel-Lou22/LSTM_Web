import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Menu,
  X,
  Home,
  Sprout,
  BarChart3,
  Settings,
  Bell,
  Plus,
  MapPin,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar tiempo cada minuto
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', active: true, href: '/' },
    { icon: Sprout, label: 'Mis Cultivos', active: false, href: '/crops' },
    { icon: BarChart3, label: 'Análisis', active: false, href: '/analytics' },
    { icon: Bell, label: 'Alertas', active: false, href: '/alerts', badge: '3' },
    { icon: Settings, label: 'Configuración', active: false, href: '/settings' },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-EC', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        
        {/* Logo y Header del Sidebar */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CropSense</span>
          </div>
          
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Información del Usuario */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Agricultor</div>
              <div className="text-xs text-gray-500">Latacunga, Ecuador</div>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {sidebarItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge className="bg-red-100 text-red-800 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </a>
            ))}
          </div>
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            CropSense v1.0.0
            <br />
            Powered by AI
          </div>
        </div>
      </div>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido Principal */}
      <div className={`transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
      }`}>
        
        {/* Header Superior */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            
            {/* Botones de navegación y menú */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                {sidebarOpen ? (
                  <ChevronLeft className="h-5 w-5 text-gray-500" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-500" />
                )}
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Dashboard Principal
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>Latacunga, Cotopaxi</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(currentTime)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones del Header */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm text-gray-500">Última actualización</div>
                <div className="text-sm font-medium text-gray-900">
                  {formatTime(currentTime)}
                </div>
              </div>
              
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Campo
              </Button>
              
              <button className="relative p-2 rounded-full hover:bg-gray-100">
                <Bell className="h-5 w-5 text-gray-500" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">3</span>
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Área de Contenido */}
        <main className="p-6">
          {/* Stats Cards Superior */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Temperatura</p>
                    <p className="text-2xl font-bold text-blue-600">25°C</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-lg">🌡️</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Humedad</p>
                    <p className="text-2xl font-bold text-cyan-600">65%</p>
                  </div>
                  <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                    <span className="text-cyan-600 text-lg">💧</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">pH del Suelo</p>
                    <p className="text-2xl font-bold text-green-600">7.2</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-lg">🧪</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Alertas Activas</p>
                    <p className="text-2xl font-bold text-red-600">3</p>
                  </div>
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-lg">⚠️</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grid Principal de Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
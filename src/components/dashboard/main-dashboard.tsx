'use client';

import React from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import WeatherWidget from '@/components/dashboard/weather-widget';
import SoilWidget from '@/components/dashboard/soil-widget';
import AlertsPanel from '@/components/dashboard/alerts-panel';

const MainDashboard: React.FC = () => {
  return (
    <DashboardLayout>
      {/* Widget de Clima - Columna izquierda superior */}
      <div className="lg:col-span-6 xl:col-span-4">
        <WeatherWidget />
      </div>

      {/* Widget de Suelo - Columna derecha superior */}
      <div className="lg:col-span-6 xl:col-span-4">
        <SoilWidget />
      </div>

      {/* Panel de Alertas - Columna derecha completa */}
      <div className="lg:col-span-12 xl:col-span-4 xl:row-span-2">
        <AlertsPanel />
      </div>

      {/* Widgets adicionales futuros */}
      <div className="lg:col-span-6 xl:col-span-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 h-64">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Análisis de Rendimiento
          </h3>
          <div className="flex items-center justify-center h-40 text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <p className="text-sm">Próximamente</p>
              <p className="text-xs text-gray-400">Gráficos de tendencias</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-6 xl:col-span-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 h-64">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🌱 Recomendaciones IA
          </h3>
          <div className="flex items-center justify-center h-40 text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">🤖</div>
              <p className="text-sm">Próximamente</p>
              <p className="text-xs text-gray-400">IA agrícola avanzada</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MainDashboard;
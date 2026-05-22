import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type HealthStatus = {
  status: string;
  database: string;
  timestamp: string;
};

export function HomePage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<HealthStatus>('/health')
      .then((res) => setHealth(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-md p-8">
        <header className="border-b pb-4 mb-6">
          <p className="text-sm uppercase tracking-wide text-primary-600 font-semibold">
            Universidad Nacional Agraria de la Selva
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">
            Sistema de Administracion de Farmacia
          </h1>
          <p className="text-gray-600 mt-2">
            Modulos: Inventario, Entrega de medicamentos, Pacientes, Proveedores y Reportes.
          </p>
        </header>

        <section>
          <h2 className="text-lg font-semibold mb-2">Estado del backend</h2>
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3">
              No se pudo conectar con la API: {error}
            </div>
          )}
          {health && (
            <div className="bg-primary-50 text-primary-900 border border-primary-100 rounded-lg p-3">
              <p>
                <span className="font-semibold">API:</span> {health.status}
              </p>
              <p>
                <span className="font-semibold">Base de datos:</span> {health.database}
              </p>
              <p className="text-xs text-gray-500 mt-1">{health.timestamp}</p>
            </div>
          )}
          {!health && !error && <p className="text-gray-500">Consultando...</p>}
        </section>
      </div>
    </div>
  );
}

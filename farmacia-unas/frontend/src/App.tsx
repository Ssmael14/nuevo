import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CategoriasPage } from '@/pages/CategoriasPage';
import { MedicamentosPage } from '@/pages/MedicamentosPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/medicamentos" element={<MedicamentosPage />} />
              <Route path="/categorias" element={<CategoriasPage />} />
              <Route
                path="/inventario"
                element={
                  <PlaceholderPage
                    title="Inventario"
                    description="Control de lotes y vencimientos"
                  />
                }
              />
              <Route
                path="/pacientes"
                element={
                  <PlaceholderPage
                    title="Pacientes"
                    description="Alumnos, docentes y administrativos"
                  />
                }
              />
              <Route
                path="/entregas"
                element={
                  <PlaceholderPage
                    title="Entregas"
                    description="Registro de entregas de medicamentos"
                  />
                }
              />
              <Route
                path="/proveedores"
                element={
                  <PlaceholderPage
                    title="Proveedores"
                    description="Proveedores y ordenes de compra"
                  />
                }
              />
              <Route
                path="/reportes"
                element={
                  <PlaceholderPage
                    title="Reportes"
                    description="Stock critico, vencimientos y estadisticas"
                  />
                }
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

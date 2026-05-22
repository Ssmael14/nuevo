import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CategoriasPage } from '@/pages/CategoriasPage';
import { MedicamentosPage } from '@/pages/MedicamentosPage';
import { PacientesPage } from '@/pages/PacientesPage';
import { ProveedoresPage } from '@/pages/ProveedoresPage';
import { InventarioPage } from '@/pages/InventarioPage';
import { EntregasPage } from '@/pages/EntregasPage';
import { NuevaEntregaPage } from '@/pages/NuevaEntregaPage';
import { EntregaDetailPage } from '@/pages/EntregaDetailPage';
import { ReportesPage } from '@/pages/ReportesPage';
import { UsuariosPage } from '@/pages/UsuariosPage';
import { ConfiguracionPage } from '@/pages/ConfiguracionPage';
import { PerfilPage } from '@/pages/PerfilPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NProgressBar } from '@/components/NProgressBar';
import { ConfirmProvider } from '@/components/ui/confirm-dialog';
import { useTheme } from '@/store/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

export function App() {
  const { theme } = useTheme();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <NProgressBar />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/medicamentos" element={<MedicamentosPage />} />
                <Route path="/categorias" element={<CategoriasPage />} />
                <Route path="/inventario" element={<InventarioPage />} />
                <Route path="/pacientes" element={<PacientesPage />} />
                <Route path="/entregas" element={<EntregasPage />} />
                <Route path="/entregas/nueva" element={<NuevaEntregaPage />} />
                <Route path="/entregas/:id" element={<EntregaDetailPage />} />
                <Route path="/proveedores" element={<ProveedoresPage />} />
                <Route path="/reportes" element={<ReportesPage />} />
                <Route path="/perfil" element={<PerfilPage />} />
                <Route element={<ProtectedRoute roles={['ADMIN']} />}>
                  <Route path="/usuarios" element={<UsuariosPage />} />
                  <Route path="/configuracion" element={<ConfiguracionPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <ConfirmProvider />
        <Toaster
          theme={theme}
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            className: 'rounded-lg',
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

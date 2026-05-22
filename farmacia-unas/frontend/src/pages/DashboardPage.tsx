import { useQuery } from '@tanstack/react-query';
import { listMedicamentos } from '@/api/medicamentos';
import { listCategorias } from '@/api/categorias';
import { useAuth } from '@/store/auth';

export function DashboardPage() {
  const user = useAuth((s) => s.user);
  const medsQuery = useQuery({
    queryKey: ['medicamentos', { page: 1, pageSize: 1 }],
    queryFn: () => listMedicamentos({ page: 1, pageSize: 1 }),
  });
  const catsQuery = useQuery({ queryKey: ['categorias'], queryFn: listCategorias });

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {user?.nombres}
        </h1>
        <p className="text-gray-600 mt-1">Resumen del sistema de farmacia.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          title="Medicamentos registrados"
          value={medsQuery.data?.total ?? '—'}
          loading={medsQuery.isLoading}
        />
        <Card
          title="Categorias"
          value={catsQuery.data?.length ?? '—'}
          loading={catsQuery.isLoading}
        />
        <Card title="Entregas hoy" value="—" />
      </div>

      <div className="mt-8 bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-2">Modulos disponibles</h2>
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-700">
          <li>Medicamentos (CRUD)</li>
          <li>Categorias (CRUD)</li>
          <li>Inventario (proximo)</li>
          <li>Pacientes (proximo)</li>
          <li>Entregas (proximo)</li>
          <li>Proveedores (proximo)</li>
          <li>Ordenes de compra (proximo)</li>
          <li>Reportes (proximo)</li>
        </ul>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  loading,
}: {
  title: string;
  value: number | string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">
        {loading ? '...' : value}
      </p>
    </div>
  );
}

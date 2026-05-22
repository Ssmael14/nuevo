import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Pill,
  Users,
  PackageCheck,
  CalendarRange,
  AlertTriangle,
  TrendingDown,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/store/auth';
import {
  getDashboard,
  getEntregasPorDia,
  getEntregasPorTipo,
  getTopMedicamentos,
} from '@/api/reportes';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

export function DashboardPage() {
  const user = useAuth((s) => s.user);
  const stats = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });
  const serie = useQuery({ queryKey: ['entregas-dia'], queryFn: () => getEntregasPorDia(30) });
  const porTipo = useQuery({ queryKey: ['entregas-tipo'], queryFn: () => getEntregasPorTipo(30) });
  const top = useQuery({ queryKey: ['top-meds'], queryFn: () => getTopMedicamentos(8, 90) });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Hola, {user?.nombres} 👋</h1>
        <p className="text-muted-foreground mt-1">Resumen general del sistema de farmacia.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Pill} label="Medicamentos" value={stats.data?.totalMedicamentos} loading={stats.isLoading} tint="emerald" />
        <StatCard icon={Users} label="Pacientes" value={stats.data?.totalPacientes} loading={stats.isLoading} tint="blue" />
        <StatCard icon={PackageCheck} label="Entregas hoy" value={stats.data?.entregasHoy} loading={stats.isLoading} tint="amber" />
        <StatCard icon={CalendarRange} label="Entregas (30d)" value={stats.data?.entregasMes} loading={stats.isLoading} tint="violet" />
        <StatCard icon={TrendingDown} label="Stock bajo" value={stats.data?.medicamentosStockBajo} loading={stats.isLoading} tint="red" />
        <StatCard icon={AlertTriangle} label="Lotes por vencer (60d)" value={stats.data?.lotesPorVencer} loading={stats.isLoading} tint="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Entregas — ultimos 30 dias</CardTitle>
            <CardDescription>Evolucion diaria de entregas registradas</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {serie.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serie.data}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="dia" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Line
                    type="monotone"
                    dataKey="cantidad"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#10b981' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por tipo de paciente</CardTitle>
            <CardDescription>Entregas en los ultimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {porTipo.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : porTipo.data && porTipo.data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={porTipo.data}
                    dataKey="cantidad"
                    nameKey="tipo"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {porTipo.data.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Sin datos
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top medicamentos entregados</CardTitle>
          <CardDescription>Ultimos 90 dias</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {top.isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top.data} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                <XAxis type="number" fontSize={11} />
                <YAxis dataKey="nombre" type="category" width={180} fontSize={11} />
                <Tooltip />
                <Bar dataKey="total" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number;
  loading?: boolean;
  tint: 'emerald' | 'blue' | 'amber' | 'violet' | 'red' | 'orange';
}

const tintClasses = {
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

function StatCard({ icon: Icon, label, value, loading, tint }: StatProps) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${tintClasses[tint]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
          {loading ? (
            <Skeleton className="h-7 w-16 mt-1" />
          ) : (
            <p className="text-2xl font-bold leading-tight">{value ?? 0}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

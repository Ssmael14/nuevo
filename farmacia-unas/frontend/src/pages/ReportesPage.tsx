import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { AlertTriangle, TrendingDown, FileBarChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { getPorVencer, getStockCritico } from '@/api/inventario';
import { getStockPorCategoria, getTopMedicamentos } from '@/api/reportes';
import { formatDate } from '@/lib/utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function ReportesPage() {
  const stockCritico = useQuery({ queryKey: ['stock-critico'], queryFn: getStockCritico });
  const porVencer = useQuery({ queryKey: ['por-vencer', 60], queryFn: () => getPorVencer(60) });
  const stockCat = useQuery({ queryKey: ['stock-por-cat'], queryFn: getStockPorCategoria });
  const topMeds = useQuery({ queryKey: ['top-meds-rep'], queryFn: () => getTopMedicamentos(10, 90) });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground mt-1">Indicadores y alertas del sistema.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Stock critico
            </CardTitle>
            <CardDescription>Medicamentos por debajo del stock minimo</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {stockCritico.isLoading ? (
              <div className="p-6 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Minimo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockCritico.data && stockCritico.data.length > 0 ? stockCritico.data.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs">{m.codigo}</TableCell>
                      <TableCell className="font-medium">{m.nombre}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">{m.stockActual}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{m.stockMinimo}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sin alertas de stock</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Lotes por vencer (60 dias)
            </CardTitle>
            <CardDescription>Productos proximos a expirar</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {porVencer.isLoading ? (
              <div className="p-6 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Vence</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {porVencer.data && porVencer.data.length > 0 ? porVencer.data.map(l => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <p className="font-medium">{l.medicamento?.nombre}</p>
                        <p className="text-xs text-muted-foreground">{l.medicamento?.codigo}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{l.numeroLote}</TableCell>
                      <TableCell>{formatDate(l.fechaVencimiento)}</TableCell>
                      <TableCell className="text-right font-semibold">{l.cantidadActual}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sin lotes proximos a vencer</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileBarChart className="h-4 w-4 text-primary-600" />
              Stock por categoria
            </CardTitle>
            <CardDescription>Distribucion del inventario</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {stockCat.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : stockCat.data && stockCat.data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockCat.data}
                    dataKey="stock"
                    nameKey="categoria"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry) => entry.categoria}
                  >
                    {stockCat.data.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top medicamentos (90 dias)</CardTitle>
            <CardDescription>Los mas dispensados</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {topMeds.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topMeds.data} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                  <XAxis type="number" fontSize={11} />
                  <YAxis dataKey="nombre" type="category" width={140} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

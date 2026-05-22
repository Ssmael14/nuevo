import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { anularEntrega, getEntrega } from '@/api/entregas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { confirm } from '@/components/ui/confirm-dialog';
import { formatDate } from '@/lib/utils';
import { toastApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';

export function EntregaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { hasRole } = useAuth();
  const canAnular = hasRole('ADMIN', 'FARMACEUTICO');

  const { data, isLoading } = useQuery({
    queryKey: ['entrega', id],
    queryFn: () => getEntrega(id!),
    enabled: !!id,
  });

  const anularMut = useMutation({
    mutationFn: () => anularEntrega(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entrega', id] });
      qc.invalidateQueries({ queryKey: ['entregas'] });
      toast.success('Entrega anulada');
    },
    onError: (e) => toastApiError(e),
  });

  async function handleAnular() {
    const ok = await confirm({
      title: `Anular entrega ${data?.numero}?`,
      description: 'Se devolvera el stock a los lotes originales.',
      confirmText: 'Anular',
      variant: 'destructive',
    });
    if (ok) anularMut.mutate();
  }

  if (isLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
  if (!data) return null;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 print:p-0">
      <div className="flex items-start justify-between print:hidden">
        <Button variant="ghost" asChild>
          <Link to="/entregas"><ArrowLeft className="h-4 w-4" /> Volver</Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
          {canAnular && data.estado === 'ENTREGADA' && (
            <Button variant="destructive" onClick={handleAnular} disabled={anularMut.isPending}>
              <Ban className="h-4 w-4" /> Anular
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Comprobante de entrega</p>
              <CardTitle className="text-2xl font-bold mt-1">{data.numero}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{formatDate(data.fecha, true)}</p>
            </div>
            {data.estado === 'ENTREGADA' ? (
              <Badge variant="success" className="text-base px-3 py-1">Entregada</Badge>
            ) : (
              <Badge variant="destructive" className="text-base px-3 py-1">Anulada</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase font-semibold text-muted-foreground mb-2">Paciente</p>
              <p className="font-semibold">{data.paciente.apellidos}, {data.paciente.nombres}</p>
              <p className="text-sm text-muted-foreground">{data.paciente.codigo} · {data.paciente.tipo}</p>
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-muted-foreground mb-2">Atendido por</p>
              <p className="font-semibold">{data.usuario.nombres} {data.usuario.apellidos}</p>
            </div>
            {data.diagnostico && (
              <div>
                <p className="text-xs uppercase font-semibold text-muted-foreground mb-2">Diagnostico</p>
                <p>{data.diagnostico}</p>
              </div>
            )}
            {data.numeroReceta && (
              <div>
                <p className="text-xs uppercase font-semibold text-muted-foreground mb-2">N° receta</p>
                <p>{data.numeroReceta}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs uppercase font-semibold text-muted-foreground mb-2">Medicamentos entregados</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Indicaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.detalles.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">{d.medicamento.codigo}</TableCell>
                    <TableCell className="font-medium">{d.medicamento.nombre}</TableCell>
                    <TableCell>
                      <p className="font-mono text-xs">{d.lote.numeroLote}</p>
                      <p className="text-xs text-muted-foreground">Vence: {formatDate(d.lote.fechaVencimiento)}</p>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{d.cantidad}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.indicaciones ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data.observaciones && (
            <div>
              <p className="text-xs uppercase font-semibold text-muted-foreground mb-2">Observaciones</p>
              <p className="text-sm">{data.observaciones}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

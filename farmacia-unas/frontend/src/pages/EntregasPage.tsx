import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  PackageCheck, Plus, Eye, Ban, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { anularEntrega, listEntregas } from '@/api/entregas';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { confirm } from '@/components/ui/confirm-dialog';
import { formatDate } from '@/lib/utils';
import { toastApiError } from '@/lib/api';
import type { Entrega } from '@/types';

export function EntregasPage() {
  const qc = useQueryClient();
  const { hasRole } = useAuth();
  const canCreate = hasRole('ADMIN', 'FARMACEUTICO', 'AUXILIAR');
  const canAnular = hasRole('ADMIN', 'FARMACEUTICO');

  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['entregas', page],
    queryFn: () => listEntregas({ page, pageSize: 15 }),
  });

  const anularMut = useMutation({
    mutationFn: anularEntrega,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['entregas'] }); toast.success('Entrega anulada y stock devuelto'); },
    onError: (e) => toastApiError(e),
  });

  async function handleAnular(e: Entrega) {
    const ok = await confirm({
      title: `Anular entrega ${e.numero}?`,
      description: 'Se devolveran las cantidades a los lotes originales.',
      confirmText: 'Anular', variant: 'destructive',
    });
    if (ok) anularMut.mutate(e.id);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entregas</h1>
          <p className="text-muted-foreground mt-1">Registro de dispensacion de medicamentos.</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link to="/entregas/nueva">
              <Plus className="h-4 w-4" /> Nueva entrega
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Atendido por</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data && data.items.length > 0 ? data.items.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs font-semibold">{e.numero}</TableCell>
                      <TableCell>{formatDate(e.fecha, true)}</TableCell>
                      <TableCell>
                        <p className="font-medium">{e.paciente.apellidos}, {e.paciente.nombres}</p>
                        <p className="text-xs text-muted-foreground">{e.paciente.codigo} · {e.paciente.tipo}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{e.detalles.length} item(s)</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.usuario.nombres} {e.usuario.apellidos}</TableCell>
                      <TableCell>
                        {e.estado === 'ENTREGADA' ? (
                          <Badge variant="success">Entregada</Badge>
                        ) : (
                          <Badge variant="destructive">Anulada</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/entregas/${e.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {canAnular && e.estado === 'ENTREGADA' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAnular(e)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableEmpty colSpan={7} icon={<PackageCheck className="h-10 w-10 opacity-30" />} message="No hay entregas registradas." />
                  )}
                </TableBody>
              </Table>

              {data && data.total > 0 && (
                <div className="flex items-center justify-between p-4 border-t border-border text-sm">
                  <p className="text-muted-foreground">{data.total} entrega(s)</p>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Pagina {data.page} de {totalPages}</span>
                    <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

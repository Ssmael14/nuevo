import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Boxes, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { createLote, deleteLote, listLotes } from '@/api/inventario';
import { listMedicamentos } from '@/api/medicamentos';
import { listProveedores } from '@/api/proveedores';
import type { Lote } from '@/types';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { confirm } from '@/components/ui/confirm-dialog';
import { formatDate } from '@/lib/utils';
import { toastApiError } from '@/lib/api';

const schema = z.object({
  medicamentoId: z.string().uuid('Selecciona un medicamento'),
  numeroLote: z.string().min(1).max(50),
  cantidadInicial: z.coerce.number().int().min(1),
  fechaVencimiento: z.string().min(1, 'Requerido'),
  precioUnitario: z.coerce.number().nonnegative().optional(),
  proveedorId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function daysToExpiry(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function vencimientoBadge(date: string) {
  const days = daysToExpiry(date);
  if (days < 0) return { variant: 'destructive' as const, label: 'Vencido' };
  if (days <= 30) return { variant: 'destructive' as const, label: `Vence en ${days}d` };
  if (days <= 90) return { variant: 'warning' as const, label: `${days}d` };
  return { variant: 'success' as const, label: `${days}d` };
}

export function InventarioPage() {
  const qc = useQueryClient();
  const { hasRole } = useAuth();
  const canWrite = hasRole('ADMIN', 'FARMACEUTICO', 'ALMACENERO');
  const canDelete = hasRole('ADMIN');

  const [filter, setFilter] = useState<'todos' | 'con-stock' | 'por-vencer'>('todos');
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['lotes', filter],
    queryFn: () => listLotes({
      soloConStock: filter === 'con-stock' ? 'true' : undefined,
      porVencerDias: filter === 'por-vencer' ? 90 : undefined,
      pageSize: 100,
    }),
  });

  const { data: medsData } = useQuery({
    queryKey: ['medicamentos-all'],
    queryFn: () => listMedicamentos({ pageSize: 100, soloActivos: 'true' }),
  });
  const { data: proveedores } = useQuery({ queryKey: ['proveedores'], queryFn: () => listProveedores() });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      medicamentoId: '', numeroLote: '', cantidadInicial: 1,
      fechaVencimiento: '', proveedorId: '',
    },
  });

  const createMut = useMutation({
    mutationFn: createLote,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lotes'] }); toast.success('Lote ingresado'); setOpen(false); form.reset(); },
    onError: (e) => toastApiError(e),
  });

  const deleteMut = useMutation({
    mutationFn: deleteLote,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lotes'] }); toast.success('Lote eliminado'); },
    onError: (e) => toastApiError(e, 'No se puede eliminar este lote'),
  });

  function onSubmit(values: FormValues) {
    createMut.mutate({
      medicamentoId: values.medicamentoId,
      numeroLote: values.numeroLote,
      cantidadInicial: values.cantidadInicial,
      fechaVencimiento: new Date(values.fechaVencimiento).toISOString(),
      precioUnitario: values.precioUnitario ?? null,
      proveedorId: values.proveedorId || null,
    });
  }

  async function handleDelete(l: Lote) {
    const ok = await confirm({
      title: `Eliminar lote ${l.numeroLote}?`,
      description: 'Solo se pueden eliminar lotes sin entregas asociadas.',
      confirmText: 'Eliminar', variant: 'destructive',
    });
    if (ok) deleteMut.mutate(l.id);
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground mt-1">Lotes de medicamentos con control de vencimiento.</p>
        </div>
        {canWrite && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Ingresar lote
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant={filter === 'todos' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('todos')}>
          Todos
        </Button>
        <Button variant={filter === 'con-stock' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('con-stock')}>
          Con stock
        </Button>
        <Button variant={filter === 'por-vencer' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('por-vencer')}>
          <AlertTriangle className="h-3.5 w-3.5" /> Por vencer (90d)
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lotes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  {canDelete && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data && data.items.length > 0 ? data.items.map(l => {
                  const v = vencimientoBadge(l.fechaVencimiento);
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs">{l.numeroLote}</TableCell>
                      <TableCell>
                        <p className="font-medium">{l.medicamento?.nombre}</p>
                        <p className="text-xs text-muted-foreground">{l.medicamento?.codigo}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.proveedor?.razonSocial ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold">{l.cantidadActual}</span>
                        <span className="text-muted-foreground text-xs"> / {l.cantidadInicial}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{formatDate(l.fechaVencimiento)}</span>
                          <Badge variant={v.variant} className="w-fit">{v.label}</Badge>
                        </div>
                      </TableCell>
                      {canDelete && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(l)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                }) : (
                  <TableEmpty colSpan={canDelete ? 6 : 5} icon={<Boxes className="h-10 w-10 opacity-30" />} message="No hay lotes registrados." />
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingresar nuevo lote</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Medicamento *" error={form.formState.errors.medicamentoId?.message}>
              <Controller
                control={form.control}
                name="medicamentoId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un medicamento" /></SelectTrigger>
                    <SelectContent>
                      {medsData?.items.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.codigo} — {m.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Numero de lote *" error={form.formState.errors.numeroLote?.message}>
                <Input {...form.register('numeroLote')} />
              </Field>
              <Field label="Cantidad inicial *" error={form.formState.errors.cantidadInicial?.message}>
                <Input type="number" min={1} {...form.register('cantidadInicial')} />
              </Field>
              <Field label="Fecha de vencimiento *" error={form.formState.errors.fechaVencimiento?.message}>
                <Input type="date" {...form.register('fechaVencimiento')} />
              </Field>
              <Field label="Precio unitario (S/.)">
                <Input type="number" step="0.01" min={0} {...form.register('precioUnitario')} />
              </Field>
            </div>
            <Field label="Proveedor">
              <Controller
                control={form.control}
                name="proveedorId"
                render={({ field }) => (
                  <Select value={field.value || '__none__'} onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Sin proveedor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Sin proveedor —</SelectItem>
                      {proveedores?.map(p => <SelectItem key={p.id} value={p.id}>{p.razonSocial}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMut.isPending}>Ingresar lote</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

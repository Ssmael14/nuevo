import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Pill, Plus, Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { listCategorias } from '@/api/categorias';
import {
  createMedicamento,
  deleteMedicamento,
  listMedicamentos,
  updateMedicamento,
} from '@/api/medicamentos';
import type { FormaFarmaceutica, Medicamento } from '@/types';
import { useAuth } from '@/store/auth';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { confirm } from '@/components/ui/confirm-dialog';
import { toastApiError } from '@/lib/api';

const FORMAS: FormaFarmaceutica[] = [
  'TABLETA', 'CAPSULA', 'JARABE', 'INYECTABLE',
  'CREMA', 'SUSPENSION', 'GOTAS', 'SUPOSITORIO', 'OTRO',
];

const schema = z.object({
  codigo: z.string().min(2).max(50),
  nombre: z.string().min(2).max(150),
  principioActivo: z.string().max(150).optional().or(z.literal('')),
  concentracion: z.string().max(50).optional().or(z.literal('')),
  formaFarmaceutica: z.enum(['TABLETA','CAPSULA','JARABE','INYECTABLE','CREMA','SUSPENSION','GOTAS','SUPOSITORIO','OTRO']),
  presentacion: z.string().max(150).optional().or(z.literal('')),
  requiereReceta: z.boolean(),
  stockMinimo: z.coerce.number().int().min(0),
  categoriaId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const emptyForm: FormValues = {
  codigo: '', nombre: '', principioActivo: '', concentracion: '',
  formaFarmaceutica: 'TABLETA', presentacion: '', requiereReceta: false,
  stockMinimo: 10, categoriaId: '',
};

export function MedicamentosPage() {
  const qc = useQueryClient();
  const { hasRole } = useAuth();
  const canWrite = hasRole('ADMIN', 'FARMACEUTICO');
  const canDelete = hasRole('ADMIN');

  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 350);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Medicamento | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['medicamentos', { q: debouncedQ, page, pageSize }],
    queryFn: () => listMedicamentos({ q: debouncedQ || undefined, page, pageSize }),
  });
  const { data: categorias } = useQuery({ queryKey: ['categorias'], queryFn: listCategorias });

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: emptyForm });

  const createMut = useMutation({
    mutationFn: createMedicamento,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medicamentos'] });
      toast.success('Medicamento creado');
      handleClose();
    },
    onError: (e) => toastApiError(e),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: FormValues }) =>
      updateMedicamento(id, { ...input, categoriaId: input.categoriaId || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medicamentos'] });
      toast.success('Medicamento actualizado');
      handleClose();
    },
    onError: (e) => toastApiError(e),
  });

  const deleteMut = useMutation({
    mutationFn: deleteMedicamento,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medicamentos'] });
      toast.success('Medicamento eliminado');
    },
    onError: (e) => toastApiError(e),
  });

  function handleOpenCreate() {
    setEditing(null);
    form.reset(emptyForm);
    setOpen(true);
  }

  function handleOpenEdit(m: Medicamento) {
    setEditing(m);
    form.reset({
      codigo: m.codigo,
      nombre: m.nombre,
      principioActivo: m.principioActivo ?? '',
      concentracion: m.concentracion ?? '',
      formaFarmaceutica: m.formaFarmaceutica,
      presentacion: m.presentacion ?? '',
      requiereReceta: m.requiereReceta,
      stockMinimo: m.stockMinimo,
      categoriaId: m.categoriaId ?? '',
    });
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setEditing(null);
  }

  function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      categoriaId: values.categoriaId || null,
      principioActivo: values.principioActivo || undefined,
      concentracion: values.concentracion || undefined,
      presentacion: values.presentacion || undefined,
    };
    if (editing) updateMut.mutate({ id: editing.id, input: values });
    else createMut.mutate(payload);
  }

  async function handleDelete(m: Medicamento) {
    const ok = await confirm({
      title: `Eliminar "${m.nombre}"?`,
      description: 'Si tiene lotes asociados se desactivara en lugar de eliminarse.',
      confirmText: 'Eliminar',
      variant: 'destructive',
    });
    if (ok) deleteMut.mutate(m.id);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medicamentos</h1>
          <p className="text-muted-foreground mt-1">Catalogo del sistema con stock total por lote.</p>
        </div>
        {canWrite && (
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" /> Nuevo medicamento
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, codigo o principio activo..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Estado</TableHead>
                    {canWrite && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data && data.items.length > 0 ? data.items.map((m) => {
                    const stock = m.stockTotal ?? 0;
                    const bajo = stock < m.stockMinimo;
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-xs">{m.codigo}</TableCell>
                        <TableCell>
                          <p className="font-medium">{m.nombre}</p>
                          {m.principioActivo && (
                            <p className="text-xs text-muted-foreground">{m.principioActivo}{m.concentracion ? ` · ${m.concentracion}` : ''}</p>
                          )}
                        </TableCell>
                        <TableCell><Badge variant="outline">{m.formaFarmaceutica}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{m.categoria?.nombre ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold ${bajo ? 'text-destructive' : ''}`}>{stock}</span>
                          <span className="text-muted-foreground text-xs"> / {m.stockMinimo}</span>
                        </TableCell>
                        <TableCell>
                          {!m.activo ? (
                            <Badge variant="secondary">Inactivo</Badge>
                          ) : bajo ? (
                            <Badge variant="destructive">Stock bajo</Badge>
                          ) : (
                            <Badge variant="success">Disponible</Badge>
                          )}
                        </TableCell>
                        {canWrite && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(m)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(m)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  }) : (
                    <TableEmpty
                      colSpan={canWrite ? 7 : 6}
                      icon={<Pill className="h-10 w-10 opacity-30" />}
                      message="No se encontraron medicamentos."
                    />
                  )}
                </TableBody>
              </Table>

              {data && data.total > 0 && (
                <div className="flex items-center justify-between p-4 border-t border-border text-sm">
                  <div className="flex items-center gap-3">
                    <p className="text-muted-foreground">
                      {data.total} resultado(s)
                    </p>
                    <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                      <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[10, 15, 25, 50].map(n => <SelectItem key={n} value={String(n)}>{n} / pag</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
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

      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar medicamento' : 'Nuevo medicamento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <FormField label="Codigo *" error={form.formState.errors.codigo?.message}>
              <Input {...form.register('codigo')} />
            </FormField>
            <FormField label="Nombre *" error={form.formState.errors.nombre?.message}>
              <Input {...form.register('nombre')} />
            </FormField>
            <FormField label="Principio activo">
              <Input {...form.register('principioActivo')} />
            </FormField>
            <FormField label="Concentracion">
              <Input {...form.register('concentracion')} placeholder="ej. 500 mg" />
            </FormField>
            <FormField label="Forma farmaceutica">
              <Controller
                control={form.control}
                name="formaFarmaceutica"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FORMAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="Categoria">
              <Controller
                control={form.control}
                name="categoriaId"
                render={({ field }) => (
                  <Select value={field.value || '__none__'} onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Sin categoria" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Sin categoria —</SelectItem>
                      {categorias?.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="Presentacion">
              <Input {...form.register('presentacion')} placeholder="ej. Caja x 100 tabletas" />
            </FormField>
            <FormField label="Stock minimo">
              <Input type="number" min={0} {...form.register('stockMinimo')} />
            </FormField>
            <div className="col-span-2 flex items-center gap-2 pt-2">
              <input type="checkbox" id="receta" {...form.register('requiereReceta')} className="h-4 w-4 rounded border-input" />
              <Label htmlFor="receta" className="cursor-pointer">Requiere receta medica</Label>
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                {editing ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

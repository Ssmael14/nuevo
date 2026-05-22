import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Search, Trash2, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  createPaciente,
  deletePaciente,
  listPacientes,
  updatePaciente,
} from '@/api/pacientes';
import type { Paciente, TipoPaciente } from '@/types';
import { useAuth } from '@/store/auth';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { toastApiError } from '@/lib/api';

const tipos: TipoPaciente[] = ['ALUMNO', 'DOCENTE', 'ADMINISTRATIVO'];

const schema = z.object({
  codigo: z.string().min(2).max(50),
  dni: z.string().max(15).optional().or(z.literal('')),
  nombres: z.string().min(2).max(100),
  apellidos: z.string().min(2).max(100),
  tipo: z.enum(['ALUMNO', 'DOCENTE', 'ADMINISTRATIVO']),
  facultad: z.string().max(150).optional().or(z.literal('')),
  escuela: z.string().max(150).optional().or(z.literal('')),
  telefono: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

const emptyForm: FormValues = {
  codigo: '', dni: '', nombres: '', apellidos: '', tipo: 'ALUMNO',
  facultad: '', escuela: '', telefono: '', email: '',
};

const tipoVariant: Record<TipoPaciente, 'info' | 'success' | 'warning'> = {
  ALUMNO: 'info', DOCENTE: 'success', ADMINISTRATIVO: 'warning',
};

export function PacientesPage() {
  const qc = useQueryClient();
  const { hasRole } = useAuth();
  const canWrite = hasRole('ADMIN', 'FARMACEUTICO', 'AUXILIAR');
  const canDelete = hasRole('ADMIN');

  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 350);
  const [tipoFilter, setTipoFilter] = useState<TipoPaciente | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Paciente | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pacientes', { q: debouncedQ, tipo: tipoFilter, page }],
    queryFn: () => listPacientes({
      q: debouncedQ || undefined,
      tipo: tipoFilter === 'ALL' ? undefined : tipoFilter,
      page,
      pageSize: 15,
    }),
  });

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: emptyForm });

  const createMut = useMutation({
    mutationFn: createPaciente,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pacientes'] });
      toast.success('Paciente registrado');
      handleClose();
    },
    onError: (e) => toastApiError(e),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: FormValues }) =>
      updatePaciente(id, {
        ...input,
        dni: input.dni || null,
        facultad: input.facultad || null,
        escuela: input.escuela || null,
        telefono: input.telefono || null,
        email: input.email || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pacientes'] });
      toast.success('Paciente actualizado');
      handleClose();
    },
    onError: (e) => toastApiError(e),
  });

  const deleteMut = useMutation({
    mutationFn: deletePaciente,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pacientes'] });
      toast.success('Paciente desactivado');
    },
    onError: (e) => toastApiError(e),
  });

  function handleOpenCreate() {
    setEditing(null);
    form.reset(emptyForm);
    setOpen(true);
  }

  function handleOpenEdit(p: Paciente) {
    setEditing(p);
    form.reset({
      codigo: p.codigo,
      dni: p.dni ?? '',
      nombres: p.nombres,
      apellidos: p.apellidos,
      tipo: p.tipo,
      facultad: p.facultad ?? '',
      escuela: p.escuela ?? '',
      telefono: p.telefono ?? '',
      email: p.email ?? '',
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
      dni: values.dni || null,
      facultad: values.facultad || null,
      escuela: values.escuela || null,
      telefono: values.telefono || null,
      email: values.email || null,
    };
    if (editing) updateMut.mutate({ id: editing.id, input: values });
    else createMut.mutate(payload);
  }

  async function handleDelete(p: Paciente) {
    const ok = await confirm({
      title: `Desactivar a ${p.nombres} ${p.apellidos}?`,
      confirmText: 'Desactivar',
      variant: 'destructive',
    });
    if (ok) deleteMut.mutate(p.id);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground mt-1">Alumnos, docentes y personal administrativo de la UNAS.</p>
        </div>
        {canWrite && (
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" /> Nuevo paciente
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-[1fr_200px] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por codigo, DNI, nombres o apellidos..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={tipoFilter} onValueChange={(v) => { setTipoFilter(v as TipoPaciente | 'ALL'); setPage(1); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los tipos</SelectItem>
              {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Nombre completo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Facultad / Escuela</TableHead>
                    <TableHead>Contacto</TableHead>
                    {canWrite && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data && data.items.length > 0 ? data.items.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.codigo}</TableCell>
                      <TableCell>
                        <p className="font-medium">{p.apellidos}, {p.nombres}</p>
                        {p.dni && <p className="text-xs text-muted-foreground">DNI: {p.dni}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tipoVariant[p.tipo]}>{p.tipo}</Badge>
                        {!p.activo && <Badge variant="secondary" className="ml-2">Inactivo</Badge>}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {p.facultad ?? '—'}{p.escuela ? ` · ${p.escuela}` : ''}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {p.telefono ?? '—'}{p.email ? ` · ${p.email}` : ''}
                      </TableCell>
                      {canWrite && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {canDelete && (
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(p)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )) : (
                    <TableEmpty
                      colSpan={canWrite ? 6 : 5}
                      icon={<Users className="h-10 w-10 opacity-30" />}
                      message="No hay pacientes registrados."
                    />
                  )}
                </TableBody>
              </Table>

              {data && data.total > 0 && (
                <div className="flex items-center justify-between p-4 border-t border-border text-sm">
                  <p className="text-muted-foreground">{data.total} resultado(s)</p>
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
            <DialogTitle>{editing ? 'Editar paciente' : 'Nuevo paciente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <Field label="Codigo *" error={form.formState.errors.codigo?.message}>
              <Input {...form.register('codigo')} />
            </Field>
            <Field label="DNI">
              <Input {...form.register('dni')} />
            </Field>
            <Field label="Nombres *" error={form.formState.errors.nombres?.message}>
              <Input {...form.register('nombres')} />
            </Field>
            <Field label="Apellidos *" error={form.formState.errors.apellidos?.message}>
              <Input {...form.register('apellidos')} />
            </Field>
            <Field label="Tipo *">
              <Controller
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Telefono">
              <Input {...form.register('telefono')} />
            </Field>
            <Field label="Facultad">
              <Input {...form.register('facultad')} />
            </Field>
            <Field label="Escuela">
              <Input {...form.register('escuela')} />
            </Field>
            <div className="col-span-2">
              <Field label="Email" error={form.formState.errors.email?.message}>
                <Input type="email" {...form.register('email')} />
              </Field>
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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

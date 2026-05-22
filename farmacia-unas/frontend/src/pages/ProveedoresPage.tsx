import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Search, Trash2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import {
  createProveedor, deleteProveedor, listProveedores, updateProveedor,
} from '@/api/proveedores';
import type { Proveedor } from '@/types';
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
import { confirm } from '@/components/ui/confirm-dialog';
import { toastApiError } from '@/lib/api';

const schema = z.object({
  ruc: z.string().length(11, 'RUC debe tener 11 digitos'),
  razonSocial: z.string().min(2).max(200),
  nombreComercial: z.string().max(200).optional().or(z.literal('')),
  direccion: z.string().max(300).optional().or(z.literal('')),
  telefono: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  contacto: z.string().max(150).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;
const emptyForm: FormValues = {
  ruc: '', razonSocial: '', nombreComercial: '', direccion: '',
  telefono: '', email: '', contacto: '',
};

export function ProveedoresPage() {
  const qc = useQueryClient();
  const { hasRole } = useAuth();
  const canWrite = hasRole('ADMIN', 'FARMACEUTICO', 'ALMACENERO');
  const canDelete = hasRole('ADMIN');

  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 350);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['proveedores', debouncedQ],
    queryFn: () => listProveedores(debouncedQ || undefined),
  });

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: emptyForm });

  const createMut = useMutation({
    mutationFn: createProveedor,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proveedores'] }); toast.success('Proveedor creado'); handleClose(); },
    onError: (e) => toastApiError(e),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: FormValues }) =>
      updateProveedor(id, {
        ...input,
        nombreComercial: input.nombreComercial || null,
        direccion: input.direccion || null,
        telefono: input.telefono || null,
        email: input.email || null,
        contacto: input.contacto || null,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proveedores'] }); toast.success('Proveedor actualizado'); handleClose(); },
    onError: (e) => toastApiError(e),
  });
  const deleteMut = useMutation({
    mutationFn: deleteProveedor,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proveedores'] }); toast.success('Proveedor desactivado'); },
    onError: (e) => toastApiError(e),
  });

  function handleOpenCreate() { setEditing(null); form.reset(emptyForm); setOpen(true); }
  function handleOpenEdit(p: Proveedor) {
    setEditing(p);
    form.reset({
      ruc: p.ruc, razonSocial: p.razonSocial,
      nombreComercial: p.nombreComercial ?? '', direccion: p.direccion ?? '',
      telefono: p.telefono ?? '', email: p.email ?? '', contacto: p.contacto ?? '',
    });
    setOpen(true);
  }
  function handleClose() { setOpen(false); setEditing(null); }

  function onSubmit(values: FormValues) {
    if (editing) updateMut.mutate({ id: editing.id, input: values });
    else createMut.mutate({
      ...values,
      nombreComercial: values.nombreComercial || null,
      direccion: values.direccion || null,
      telefono: values.telefono || null,
      email: values.email || null,
      contacto: values.contacto || null,
    });
  }

  async function handleDelete(p: Proveedor) {
    const ok = await confirm({
      title: `Desactivar a ${p.razonSocial}?`,
      confirmText: 'Desactivar', variant: 'destructive',
    });
    if (ok) deleteMut.mutate(p.id);
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground mt-1">Empresas que suministran medicamentos.</p>
        </div>
        {canWrite && (
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" /> Nuevo proveedor
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por RUC o razon social..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RUC</TableHead>
                  <TableHead>Razon social</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Telefono / Email</TableHead>
                  <TableHead>Estado</TableHead>
                  {canWrite && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data && data.length > 0 ? data.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.ruc}</TableCell>
                    <TableCell>
                      <p className="font-medium">{p.razonSocial}</p>
                      {p.nombreComercial && <p className="text-xs text-muted-foreground">{p.nombreComercial}</p>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.contacto ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.telefono ?? '—'}{p.email ? ` · ${p.email}` : ''}
                    </TableCell>
                    <TableCell>
                      {p.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>}
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
                  <TableEmpty colSpan={canWrite ? 6 : 5} icon={<Truck className="h-10 w-10 opacity-30" />} message="No hay proveedores registrados." />
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar proveedor' : 'Nuevo proveedor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <Field label="RUC *" error={form.formState.errors.ruc?.message}>
              <Input {...form.register('ruc')} maxLength={11} />
            </Field>
            <Field label="Razon social *" error={form.formState.errors.razonSocial?.message}>
              <Input {...form.register('razonSocial')} />
            </Field>
            <Field label="Nombre comercial">
              <Input {...form.register('nombreComercial')} />
            </Field>
            <Field label="Contacto">
              <Input {...form.register('contacto')} />
            </Field>
            <Field label="Telefono">
              <Input {...form.register('telefono')} />
            </Field>
            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register('email')} />
            </Field>
            <div className="col-span-2">
              <Field label="Direccion">
                <Input {...form.register('direccion')} />
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

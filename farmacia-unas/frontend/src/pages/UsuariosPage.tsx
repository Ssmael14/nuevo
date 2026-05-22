import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Trash2, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import {
  createUsuario, deleteUsuario, listUsuarios, updateUsuario,
} from '@/api/usuarios';
import type { RolUsuario, Usuario } from '@/types';
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

const roles: RolUsuario[] = ['ADMIN', 'FARMACEUTICO', 'ALMACENERO', 'AUXILIAR'];

const createSchema = z.object({
  nombres: z.string().min(2),
  apellidos: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  rol: z.enum(['ADMIN', 'FARMACEUTICO', 'ALMACENERO', 'AUXILIAR']),
});

const editSchema = createSchema.partial();

type FormValues = z.infer<typeof createSchema>;

const rolVariant: Record<RolUsuario, 'default' | 'info' | 'success' | 'warning'> = {
  ADMIN: 'default', FARMACEUTICO: 'success', ALMACENERO: 'info', AUXILIAR: 'warning',
};

export function UsuariosPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['usuarios'], queryFn: listUsuarios });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(editing ? editSchema : createSchema) as never,
    defaultValues: { nombres: '', apellidos: '', email: '', password: '', rol: 'AUXILIAR' },
  });

  const createMut = useMutation({
    mutationFn: createUsuario,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); toast.success('Usuario creado'); close(); },
    onError: (e) => toastApiError(e),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<FormValues> }) =>
      updateUsuario(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); toast.success('Usuario actualizado'); close(); },
    onError: (e) => toastApiError(e),
  });
  const deleteMut = useMutation({
    mutationFn: deleteUsuario,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); toast.success('Usuario desactivado'); },
    onError: (e) => toastApiError(e),
  });

  function openCreate() {
    setEditing(null);
    form.reset({ nombres: '', apellidos: '', email: '', password: '', rol: 'AUXILIAR' });
    setOpen(true);
  }
  function openEdit(u: Usuario) {
    setEditing(u);
    form.reset({
      nombres: u.nombres, apellidos: u.apellidos, email: u.email, password: '', rol: u.rol,
    });
    setOpen(true);
  }
  function close() { setOpen(false); setEditing(null); }

  function onSubmit(values: FormValues) {
    if (editing) {
      const input: Partial<FormValues> = { ...values };
      if (!input.password) delete input.password;
      updateMut.mutate({ id: editing.id, input });
    } else {
      createMut.mutate(values);
    }
  }

  async function handleDelete(u: Usuario) {
    const ok = await confirm({
      title: `Desactivar a ${u.nombres} ${u.apellidos}?`,
      confirmText: 'Desactivar', variant: 'destructive',
    });
    if (ok) deleteMut.mutate(u.id);
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground mt-1">Gestion del personal con acceso al sistema.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nuevo usuario</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data && data.length > 0 ? data.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.apellidos}, {u.nombres}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell><Badge variant={rolVariant[u.rol]}>{u.rol}</Badge></TableCell>
                    <TableCell>
                      {u.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {u.activo && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(u)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableEmpty colSpan={5} icon={<UserCog className="h-10 w-10 opacity-30" />} message="No hay usuarios." />
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombres *" error={form.formState.errors.nombres?.message}>
                <Input {...form.register('nombres')} />
              </Field>
              <Field label="Apellidos *" error={form.formState.errors.apellidos?.message}>
                <Input {...form.register('apellidos')} />
              </Field>
            </div>
            <Field label="Email *" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register('email')} />
            </Field>
            <Field label={editing ? 'Contrasena (dejar vacio para no cambiar)' : 'Contrasena *'} error={form.formState.errors.password?.message}>
              <Input type="password" {...form.register('password')} />
            </Field>
            <Field label="Rol *">
              <Controller
                control={form.control}
                name="rol"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
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

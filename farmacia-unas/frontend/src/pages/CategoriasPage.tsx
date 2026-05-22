import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createCategoria,
  deleteCategoria,
  listCategorias,
  updateCategoria,
} from '@/api/categorias';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { confirm } from '@/components/ui/confirm-dialog';
import { toastApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { Categoria } from '@/types';

const schema = z.object({
  nombre: z.string().min(2, 'Minimo 2 caracteres').max(100),
  descripcion: z.string().max(500).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export function CategoriasPage() {
  const qc = useQueryClient();
  const { hasRole } = useAuth();
  const canWrite = hasRole('ADMIN', 'FARMACEUTICO');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['categorias'], queryFn: listCategorias });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', descripcion: '' },
  });

  const createMut = useMutation({
    mutationFn: createCategoria,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria creada');
      handleClose();
    },
    onError: (e) => toastApiError(e),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: FormValues }) => updateCategoria(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria actualizada');
      handleClose();
    },
    onError: (e) => toastApiError(e),
  });

  const deleteMut = useMutation({
    mutationFn: deleteCategoria,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria eliminada');
    },
    onError: (e) => toastApiError(e, 'No se pudo eliminar'),
  });

  function handleOpenCreate() {
    setEditing(null);
    form.reset({ nombre: '', descripcion: '' });
    setOpen(true);
  }

  function handleOpenEdit(cat: Categoria) {
    setEditing(cat);
    form.reset({ nombre: cat.nombre, descripcion: cat.descripcion ?? '' });
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setEditing(null);
  }

  function onSubmit(values: FormValues) {
    const payload = { ...values, descripcion: values.descripcion || undefined };
    if (editing) updateMut.mutate({ id: editing.id, input: payload });
    else createMut.mutate(payload);
  }

  async function handleDelete(cat: Categoria) {
    const ok = await confirm({
      title: `Eliminar "${cat.nombre}"?`,
      description: 'Esta accion no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'destructive',
    });
    if (ok) deleteMut.mutate(cat.id);
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground mt-1">Clasificacion de medicamentos del catalogo.</p>
        </div>
        {canWrite && (
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" /> Nueva categoria
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Listado</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead className="text-right">Medicamentos</TableHead>
                  {canWrite && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data && data.length > 0 ? (
                  data.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.nombre}</TableCell>
                      <TableCell className="text-muted-foreground">{cat.descripcion ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{cat._count?.medicamentos ?? 0}</Badge>
                      </TableCell>
                      {canWrite && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(cat)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(cat)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableEmpty
                    colSpan={canWrite ? 4 : 3}
                    icon={<Tags className="h-10 w-10 opacity-30" />}
                    message="No hay categorias registradas. Crea la primera."
                  />
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar categoria' : 'Nueva categoria'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" {...form.register('nombre')} />
              {form.formState.errors.nombre && (
                <p className="text-xs text-destructive">{form.formState.errors.nombre.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripcion</Label>
              <Textarea id="descripcion" rows={3} {...form.register('descripcion')} />
            </div>
            <DialogFooter>
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

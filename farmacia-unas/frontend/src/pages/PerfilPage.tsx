import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { KeyRound, User } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { changePassword } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toastApiError } from '@/lib/api';

const schema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
  confirm: z.string().min(6),
}).refine((d) => d.newPassword === d.confirm, {
  message: 'Las contrasenas no coinciden',
  path: ['confirm'],
});
type FormValues = z.infer<typeof schema>;

export function PerfilPage() {
  const { user, logout } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  });

  async function onSubmit(values: FormValues) {
    try {
      await changePassword(values.currentPassword, values.newPassword);
      toast.success('Contrasena actualizada. Vuelve a iniciar sesion.');
      setTimeout(() => { logout(); window.location.href = '/login'; }, 1500);
    } catch (e) {
      toastApiError(e);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-muted-foreground mt-1">Informacion personal y seguridad.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> Datos personales
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Info label="Nombres" value={user?.nombres ?? '—'} />
          <Info label="Apellidos" value={user?.apellidos ?? '—'} />
          <Info label="Email" value={user?.email ?? '—'} />
          <div>
            <p className="text-xs uppercase font-semibold text-muted-foreground mb-1">Rol</p>
            <Badge variant="default">{user?.rol}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" /> Cambiar contrasena
          </CardTitle>
          <CardDescription>Tras cambiar, deberas iniciar sesion nuevamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label>Contrasena actual</Label>
              <Input type="password" {...form.register('currentPassword')} />
              {form.formState.errors.currentPassword && (
                <p className="text-xs text-destructive">{form.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Nueva contrasena</Label>
              <Input type="password" {...form.register('newPassword')} />
              {form.formState.errors.newPassword && (
                <p className="text-xs text-destructive">{form.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Confirmar nueva contrasena</Label>
              <Input type="password" {...form.register('confirm')} />
              {form.formState.errors.confirm && (
                <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
              )}
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>Actualizar contrasena</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase font-semibold text-muted-foreground mb-1">{label}</p>
      <p>{value}</p>
    </div>
  );
}

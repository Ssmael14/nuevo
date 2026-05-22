import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Save, Settings, Building2, Bell, Eye, Image as ImageIcon } from 'lucide-react';
import {
  getConfiguracion,
  updateConfiguracion,
  ConfiguracionInput,
} from '@/api/configuracion';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toastApiError } from '@/lib/api';

const schema = z.object({
  nombreInstitucion: z.string().min(2).max(200),
  nombreFarmacia: z.string().min(2).max(200),
  direccion: z.string().max(300).optional().or(z.literal('')),
  telefono: z.string().max(50).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  rucInstitucion: z.string().max(11).optional().or(z.literal('')),
  mostrarDemoLogin: z.boolean(),
  diasAlertaVencimiento: z.coerce.number().int().min(1).max(365),
  textoComprobante: z.string().max(500).optional().or(z.literal('')),
  logoUrl: z.string().max(500).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export function ConfiguracionPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['configuracion'], queryFn: getConfiguracion });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombreInstitucion: '',
      nombreFarmacia: '',
      direccion: '',
      telefono: '',
      email: '',
      rucInstitucion: '',
      mostrarDemoLogin: true,
      diasAlertaVencimiento: 90,
      textoComprobante: '',
      logoUrl: '',
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        nombreInstitucion: data.nombreInstitucion,
        nombreFarmacia: data.nombreFarmacia,
        direccion: data.direccion ?? '',
        telefono: data.telefono ?? '',
        email: data.email ?? '',
        rucInstitucion: data.rucInstitucion ?? '',
        mostrarDemoLogin: data.mostrarDemoLogin,
        diasAlertaVencimiento: data.diasAlertaVencimiento,
        textoComprobante: data.textoComprobante ?? '',
        logoUrl: data.logoUrl ?? '',
      });
    }
  }, [data, form]);

  const updateMut = useMutation({
    mutationFn: updateConfiguracion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['configuracion'] });
      qc.invalidateQueries({ queryKey: ['configuracion-publica'] });
      toast.success('Configuracion actualizada');
    },
    onError: (e) => toastApiError(e),
  });

  function onSubmit(values: FormValues) {
    const payload: ConfiguracionInput = {
      ...values,
      direccion: values.direccion || null,
      telefono: values.telefono || null,
      email: values.email || null,
      rucInstitucion: values.rucInstitucion || null,
      textoComprobante: values.textoComprobante || null,
      logoUrl: values.logoUrl || null,
    };
    updateMut.mutate(payload);
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <header>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Settings className="h-4 w-4" />
          <span>Ajustes del sistema</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Configuracion</h1>
        <p className="text-muted-foreground mt-1">
          Solo el rol ADMIN puede modificar estos valores. Los cambios se aplican de inmediato.
        </p>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" /> Datos de la institucion
            </CardTitle>
            <CardDescription>Informacion que aparece en la cabecera del sistema y los comprobantes.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre de la institucion *" error={form.formState.errors.nombreInstitucion?.message}>
              <Input {...form.register('nombreInstitucion')} />
            </Field>
            <Field label="Nombre de la farmacia *" error={form.formState.errors.nombreFarmacia?.message}>
              <Input {...form.register('nombreFarmacia')} />
            </Field>
            <Field label="RUC">
              <Input maxLength={11} {...form.register('rucInstitucion')} />
            </Field>
            <Field label="Telefono">
              <Input {...form.register('telefono')} />
            </Field>
            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register('email')} />
            </Field>
            <Field label="Direccion">
              <Input {...form.register('direccion')} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" /> Pantalla de inicio
            </CardTitle>
            <CardDescription>Que ven los usuarios antes de iniciar sesion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <input
                id="mostrarDemo"
                type="checkbox"
                {...form.register('mostrarDemoLogin')}
                className="h-4 w-4 mt-0.5 rounded border-input"
              />
              <div>
                <Label htmlFor="mostrarDemo" className="cursor-pointer">
                  Mostrar credenciales demo en el login
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Si esta activo, la pantalla de login muestra el texto{' '}
                  <code>admin@unas.edu.pe / admin123</code> y los campos vienen prellenados. Desactivalo en produccion.
                </p>
              </div>
            </div>

            <Field label="URL de logo personalizado (opcional)">
              <div className="flex gap-2">
                <ImageIcon className="h-5 w-5 text-muted-foreground self-center" />
                <Input
                  {...form.register('logoUrl')}
                  placeholder="/logo-unas.png  o  https://..."
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Por defecto se usa <code>/logo-unas.png</code> con fallback a <code>/logo-unas.svg</code>.
              </p>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" /> Alertas y comprobantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Dias de anticipacion para alertar vencimientos"
              error={form.formState.errors.diasAlertaVencimiento?.message}
            >
              <Input type="number" min={1} max={365} {...form.register('diasAlertaVencimiento')} />
              <p className="text-xs text-muted-foreground mt-1">
                Los lotes que venzan en los proximos N dias se mostraran en los reportes de "por vencer".
              </p>
            </Field>
            <Field label="Texto al pie del comprobante de entrega">
              <Textarea
                rows={3}
                {...form.register('textoComprobante')}
                placeholder="Tomar segun indicacion medica. En caso de reaccion adversa acudir al servicio medico."
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMut.isPending}>
            <Save className="h-4 w-4" /> Guardar cambios
          </Button>
        </div>
      </form>
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

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cross, Loader2, Pill, ShieldCheck, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { login } from '@/api/auth';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toastApiError } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { accessToken, setSession } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@unas.edu.pe', password: 'admin123' },
  });

  if (accessToken) return <Navigate to="/" replace />;

  async function onSubmit(values: FormValues) {
    try {
      const { accessToken, refreshToken, user } = await login(values.email, values.password);
      setSession(accessToken, refreshToken, user);
      toast.success(`Bienvenido, ${user.nombres}`);
      const returnTo = localStorage.getItem('returnTo');
      localStorage.removeItem('returnTo');
      navigate(returnTo ?? '/');
    } catch (err) {
      toastApiError(err, 'No se pudo iniciar sesion');
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel decorativo (institucional) */}
      <div className="hidden lg:flex relative bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="flex items-center gap-3 mb-12">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Cross className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-primary-200 font-semibold">UNAS</p>
              <p className="text-xl font-bold leading-tight">Farmacia Universitaria</p>
            </div>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black leading-tight max-w-md">
            Atencion farmaceutica al servicio de la comunidad universitaria.
          </h1>
          <p className="mt-4 text-primary-100/80 max-w-md leading-relaxed">
            Universidad Nacional Agraria de la Selva. Sistema integral para la gestion del
            inventario y entrega de medicamentos a alumnos, docentes y personal administrativo.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative grid grid-cols-3 gap-3 text-sm"
        >
          <Feature icon={Pill} label="Catalogo y stock" />
          <Feature icon={ShieldCheck} label="Trazabilidad" />
          <Feature icon={Leaf} label="Tingo Maria" />
        </motion.div>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-primary-600 text-white flex items-center justify-center">
              <Cross className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-primary-600 font-semibold">UNAS</p>
              <p className="text-lg font-bold leading-tight">Farmacia</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold">Bienvenido</h2>
          <p className="text-muted-foreground text-sm mt-1">Inicia sesion para continuar.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-8">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="usuario@unas.edu.pe" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-8">
            Demo: <code className="font-mono">admin@unas.edu.pe</code> / <code className="font-mono">admin123</code>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 backdrop-blur border border-white/10">
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium text-center">{label}</span>
    </div>
  );
}

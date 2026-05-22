import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="text-center">
        <p className="text-7xl font-black text-primary-600">404</p>
        <h1 className="mt-4 text-2xl font-bold">Pagina no encontrada</h1>
        <p className="mt-2 text-muted-foreground">La ruta que buscas no existe o fue movida.</p>
        <Button asChild className="mt-6">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}

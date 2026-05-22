import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('ErrorBoundary captured:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-md text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Algo salio mal</h1>
            <p className="text-muted-foreground mb-6">
              {this.state.error?.message ?? 'Error inesperado en la aplicacion.'}
            </p>
            <Button onClick={() => window.location.reload()}>Recargar pagina</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

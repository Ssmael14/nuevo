import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';

interface State {
  open: boolean;
  title: string;
  description?: string;
  confirmText: string;
  variant: 'default' | 'destructive';
  resolve?: (v: boolean) => void;
}

let openConfirm: ((opts: Omit<State, 'open' | 'resolve'>) => Promise<boolean>) | null = null;

export function confirm(opts: {
  title: string;
  description?: string;
  confirmText?: string;
  variant?: 'default' | 'destructive';
}): Promise<boolean> {
  if (!openConfirm) return Promise.resolve(window.confirm(opts.title));
  return openConfirm({
    title: opts.title,
    description: opts.description,
    confirmText: opts.confirmText ?? 'Confirmar',
    variant: opts.variant ?? 'default',
  });
}

export function ConfirmProvider() {
  const [state, setState] = useState<State>({
    open: false,
    title: '',
    confirmText: 'Confirmar',
    variant: 'default',
  });

  openConfirm = (opts) =>
    new Promise<boolean>((resolve) => {
      setState({ ...opts, open: true, resolve });
    });

  const close = (result: boolean) => {
    state.resolve?.(result);
    setState((s) => ({ ...s, open: false, resolve: undefined }));
  };

  return (
    <Dialog open={state.open} onOpenChange={(o) => !o && close(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{state.title}</DialogTitle>
          {state.description && <DialogDescription>{state.description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => close(false)}>
            Cancelar
          </Button>
          <Button variant={state.variant} onClick={() => close(true)}>
            {state.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

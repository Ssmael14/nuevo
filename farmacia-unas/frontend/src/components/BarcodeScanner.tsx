import { useEffect, useRef, useState } from 'react';
import { ScanLine, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  /** Callback que se llama cuando se completa un escaneo o se presiona Enter. */
  onScan: (codigo: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

/**
 * Componente de entrada por codigo de barras.
 * Compatible con scanners USB tipo "keyboard wedge" (los mas comunes en farmacias):
 *
 * - Detecta una rafaga de teclas rapidas (< 50ms entre teclas) y dispara onScan
 *   automaticamente, sin necesidad de presionar Enter.
 * - Tambien acepta Enter manual y un boton "Buscar" para entrada de teclado normal.
 * - Mantiene el foco para no perder escaneos consecutivos.
 */
export function BarcodeScanner({ onScan, placeholder, autoFocus = true, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [valor, setValor] = useState('');
  const ultimaTecla = useRef<number>(0);
  const rafagaActiva = useRef<boolean>(false);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function dispararEscaneo(codigo: string) {
    const limpio = codigo.trim();
    if (!limpio) return;
    onScan(limpio);
    setValor('');
    // Reenfocar para escanear el siguiente
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const ahora = Date.now();
    const delta = ahora - ultimaTecla.current;
    // Rafaga: teclas muy rapidas seguidas => probablemente scanner USB
    if (delta < 50 && delta > 0) rafagaActiva.current = true;
    ultimaTecla.current = ahora;

    if (e.key === 'Enter') {
      e.preventDefault();
      dispararEscaneo(valor);
      rafagaActiva.current = false;
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValor(e.target.value);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-600" />
          <Input
            ref={inputRef}
            value={valor}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? 'Escanea o ingresa el codigo de barras y presiona Enter'}
            className="pl-9 font-mono"
            disabled={disabled}
            autoComplete="off"
          />
        </div>
        <Button type="button" onClick={() => dispararEscaneo(valor)} disabled={disabled || !valor.trim()}>
          <Search className="h-4 w-4" /> Buscar
        </Button>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" className="font-normal">
          <ScanLine className="h-3 w-3 mr-1" /> Scanner USB compatible
        </Badge>
        <span>El campo permanece enfocado para escaneos continuos.</span>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';

interface Props {
  size?: number;
  className?: string;
}

/**
 * Logo institucional UNAS.
 * Carga `/logo-unas.png` si existe; si no, cae al SVG `/logo-unas.svg`.
 * Para usar el logo oficial: dejar el PNG en `frontend/public/logo-unas.png`.
 */
export function Logo({ size = 40, className }: Props) {
  return (
    <img
      src="/logo-unas.png"
      onError={(e) => {
        const img = e.currentTarget;
        if (img.src.endsWith('.png')) img.src = '/logo-unas.svg';
      }}
      alt="Logo UNAS"
      width={size}
      height={size}
      className={cn('object-contain select-none', className)}
      draggable={false}
    />
  );
}

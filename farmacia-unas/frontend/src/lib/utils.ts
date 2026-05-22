import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date | null | undefined, withTime = false): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  if (!withTime) return date;
  const time = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

export function debounce<T extends (...args: never[]) => unknown>(fn: T, wait: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

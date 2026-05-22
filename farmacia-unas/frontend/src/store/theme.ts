import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

function initial(): Theme {
  const stored = localStorage.getItem('theme') as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', t === 'dark');
  localStorage.setItem('theme', t);
}

export const useTheme = create<ThemeState>((set, get) => {
  const t = initial();
  applyTheme(t);
  return {
    theme: t,
    toggle: () => {
      const next = get().theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      set({ theme: next });
    },
    setTheme: (t) => {
      applyTheme(t);
      set({ theme: t });
    },
  };
});

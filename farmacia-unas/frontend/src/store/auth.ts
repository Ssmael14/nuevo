import { create } from 'zustand';
import type { Usuario } from '@/types';

interface AuthState {
  token: string | null;
  user: Usuario | null;
  setSession: (token: string, user: Usuario) => void;
  logout: () => void;
}

function loadUser(): Usuario | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
}

export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: loadUser(),
  setSession: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));

import { create } from 'zustand';
import type { Usuario, RolUsuario } from '@/types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: Usuario | null;
  setSession: (accessToken: string, refreshToken: string, user: Usuario) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  hasRole: (...roles: RolUsuario[]) => boolean;
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

export const useAuth = create<AuthState>((set, get) => ({
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  user: loadUser(),
  setSession: (accessToken, refreshToken, user) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ accessToken, refreshToken, user });
  },
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ accessToken: null, refreshToken: null, user: null });
  },
  hasRole: (...roles) => {
    const u = get().user;
    return !!u && roles.includes(u.rol);
  },
}));

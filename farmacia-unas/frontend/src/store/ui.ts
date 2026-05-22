import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  toggleSidebar: () => void;
  setSidebarMobile: (open: boolean) => void;
}

export const useUI = create<UIState>((set) => ({
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  sidebarMobileOpen: false,
  toggleSidebar: () => {
    set((s) => {
      const next = !s.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', String(next));
      return { sidebarCollapsed: next };
    });
  },
  setSidebarMobile: (open) => set({ sidebarMobileOpen: open }),
}));

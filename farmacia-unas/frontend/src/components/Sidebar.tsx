import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Pill,
  Tags,
  Boxes,
  Users,
  PackageCheck,
  Truck,
  BarChart3,
  ChevronLeft,
  UserCog,
  Cross,
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useUI } from '@/store/ui';
import { useAuth } from '@/store/auth';
import { cn } from '@/lib/utils';
import type { RolUsuario } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: RolUsuario[];
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/medicamentos', label: 'Medicamentos', icon: Pill },
  { to: '/categorias', label: 'Categorias', icon: Tags },
  { to: '/inventario', label: 'Inventario', icon: Boxes },
  { to: '/pacientes', label: 'Pacientes', icon: Users },
  { to: '/entregas', label: 'Entregas', icon: PackageCheck },
  { to: '/proveedores', label: 'Proveedores', icon: Truck },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/usuarios', label: 'Usuarios', icon: UserCog, roles: ['ADMIN'] },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobile } = useUI();
  const { user } = useAuth();

  const visibleItems = navItems.filter((i) => !i.roles || (user && i.roles.includes(user.rol)));

  return (
    <>
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarMobile(false)}
        />
      )}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          'fixed md:relative z-50 h-screen bg-gradient-to-b from-primary-900 to-primary-950 text-white flex flex-col',
          'transition-transform md:translate-x-0',
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-primary-800/50">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Cross className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="text-[10px] uppercase tracking-widest text-primary-200 font-semibold">UNAS</p>
                <p className="font-bold text-sm leading-tight">Farmacia</p>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded hover:bg-white/10 transition-colors"
            aria-label="Colapsar sidebar"
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', sidebarCollapsed && 'rotate-180')} />
          </button>
        </div>

        <Tooltip.Provider delayDuration={0}>
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-thin">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const link = (
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setSidebarMobile(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-primary-100/80 hover:bg-white/10 hover:text-white',
                      sidebarCollapsed && 'justify-center',
                    )
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );

              if (!sidebarCollapsed) return <div key={item.to}>{link}</div>;
              return (
                <Tooltip.Root key={item.to}>
                  <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="right"
                      sideOffset={8}
                      className="bg-card text-card-foreground text-xs font-medium px-2 py-1 rounded-md shadow-md border border-border"
                    >
                      {item.label}
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              );
            })}
          </nav>
        </Tooltip.Provider>

        {!sidebarCollapsed && (
          <div className="p-3 border-t border-primary-800/50 text-xs text-primary-200">
            <p>UNAS · Tingo Maria</p>
            <p className="text-primary-300/80">Sistema v0.2.0</p>
          </div>
        )}
      </motion.aside>
    </>
  );
}

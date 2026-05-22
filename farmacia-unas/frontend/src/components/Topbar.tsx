import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, Moon, Sun, ChevronRight, LogOut, KeyRound, User } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/store/theme';
import { useUI } from '@/store/ui';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { logoutApi } from '@/api/auth';

const labels: Record<string, string> = {
  '': 'Dashboard',
  medicamentos: 'Medicamentos',
  categorias: 'Categorias',
  inventario: 'Inventario',
  pacientes: 'Pacientes',
  entregas: 'Entregas',
  proveedores: 'Proveedores',
  reportes: 'Reportes',
  usuarios: 'Usuarios',
  perfil: 'Mi perfil',
  nueva: 'Nueva',
};

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs = [{ label: 'Inicio', to: '/' }];
  let acc = '';
  for (const p of parts) {
    acc += `/${p}`;
    crumbs.push({ label: labels[p] ?? p, to: acc });
  }
  return crumbs;
}

export function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, refreshToken } = useAuth();
  const { theme, toggle } = useTheme();
  const { setSidebarMobile } = useUI();
  const crumbs = getBreadcrumbs(location.pathname);

  async function handleLogout() {
    if (refreshToken) {
      try {
        await logoutApi(refreshToken);
      } catch {
        // ignore
      }
    }
    logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur border-b border-border flex items-center px-4 md:px-6 gap-4">
      <button
        onClick={() => setSidebarMobile(true)}
        className="md:hidden p-2 rounded hover:bg-muted"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground flex-1 min-w-0 overflow-hidden">
        {crumbs.map((c, i) => (
          <span key={c.to} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-foreground truncate">{c.label}</span>
            ) : (
              <Link to={c.to} className="hover:text-foreground transition-colors truncate">
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <Button variant="ghost" size="icon" onClick={toggle} aria-label="Cambiar tema">
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
            <div className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-semibold">
              {user?.nombres.charAt(0)}
              {user?.apellidos.charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-tight">
                {user?.nombres} {user?.apellidos}
              </p>
              <p className="text-xs text-muted-foreground">{user?.rol}</p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate('/perfil')}>
            <User className="h-4 w-4" /> Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate('/perfil')}>
            <KeyRound className="h-4 w-4" /> Cambiar contrasena
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" /> Cerrar sesion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

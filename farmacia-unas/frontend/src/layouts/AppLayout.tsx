import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { to: '/medicamentos', label: 'Medicamentos', icon: 'M9 12h6m-3-3v6' },
  { to: '/categorias', label: 'Categorias', icon: 'M4 6h16M4 12h16M4 18h16' },
  { to: '/inventario', label: 'Inventario', icon: 'M20 7L12 3 4 7v10l8 4 8-4V7z' },
  { to: '/pacientes', label: 'Pacientes', icon: 'M5 20a7 7 0 0114 0M12 11a4 4 0 100-8 4 4 0 000 8z' },
  { to: '/entregas', label: 'Entregas', icon: 'M3 8l9 6 9-6M3 8v10h18V8' },
  { to: '/proveedores', label: 'Proveedores', icon: 'M3 7h18M3 12h18M3 17h18' },
  { to: '/reportes', label: 'Reportes', icon: 'M9 17v-6m4 6V7m4 10v-3' },
];

export function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-primary-900 text-white flex flex-col">
        <div className="p-5 border-b border-primary-700">
          <p className="text-xs uppercase tracking-wider text-primary-100">UNAS</p>
          <h1 className="text-lg font-bold leading-tight">Farmacia</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-100 hover:bg-primary-700/60'
                }`
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-primary-700 text-sm">
          {user && (
            <div className="mb-2">
              <p className="font-medium">
                {user.nombres} {user.apellidos}
              </p>
              <p className="text-xs text-primary-200">{user.rol}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 bg-primary-700 hover:bg-primary-600 rounded-lg text-sm"
          >
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

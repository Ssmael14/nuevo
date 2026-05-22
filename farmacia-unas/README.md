# Sistema de Administración de Farmacia — UNAS

Sistema web para la administración de la farmacia de la **Universidad Nacional Agraria de la Selva**.
La farmacia **no vende** medicamentos: los **entrega** a alumnos, docentes y personal administrativo.

## Stack

- **Backend:** Node.js 20 + Express 4 + TypeScript + Prisma 5
- **Frontend:** React 18 + Vite 5 + TypeScript + TailwindCSS + Radix UI (estilo shadcn/ui)
- **Base de datos:** PostgreSQL 16
- **Orquestación:** Docker Compose con healthchecks
- **Logging:** Pino (estructurado)
- **Auth:** JWT con access + refresh tokens (rotación)
- **Validación:** Zod (backend + frontend con react-hook-form)
- **Notificaciones:** Sonner (toasts)
- **Gráficos:** Recharts
- **Animaciones:** Framer Motion
- **Docs API:** Swagger UI en `/api/docs`
- **Tests:** Vitest + Supertest
- **CI:** GitHub Actions

## Módulos implementados

| Módulo | Estado | Notas |
|---|---|---|
| Autenticación | ✅ | JWT access + refresh, rate limit en login, cambio de contraseña |
| Usuarios y roles | ✅ | ADMIN, FARMACEUTICO, ALMACENERO, AUXILIAR |
| Pacientes | ✅ | Alumnos, docentes, administrativos. Búsqueda + filtros |
| Categorías | ✅ | CRUD con bloqueo si están en uso |
| Medicamentos | ✅ | Catálogo con stock total, búsqueda, paginación |
| Inventario por lotes | ✅ | Ingreso de lotes con vencimiento, alertas por colores |
| Entregas | ✅ | Con descuento FEFO (primero los que vencen antes), anulación con reversa |
| Proveedores | ✅ | CRUD completo |
| Reportes | ✅ | Dashboard con gráficos, stock crítico, por vencer, top medicamentos |
| Auditoría | ✅ | Tabla `audit_logs` |

## Estructura

```
farmacia-unas/
├── docker-compose.yml          # 3 servicios con healthchecks
├── .env.example
├── package.json                # husky + lint-staged + prettier (raíz)
├── .github/workflows/ci.yml    # Pipeline (lint + tests + docker build)
├── backend/
│   ├── src/
│   │   ├── app.ts, index.ts
│   │   ├── config/             # env, db, logger, openapi
│   │   ├── middlewares/        # auth, errorHandler, rateLimit
│   │   ├── modules/
│   │   │   ├── auth/           # login, refresh, logout, change-password
│   │   │   ├── usuarios/
│   │   │   ├── pacientes/
│   │   │   ├── categorias/
│   │   │   ├── medicamentos/
│   │   │   ├── inventario/     # lotes, stock-critico, por-vencer
│   │   │   ├── entregas/       # FEFO + anular
│   │   │   ├── proveedores/
│   │   │   └── reportes/       # dashboard, charts data
│   │   ├── routes/index.ts
│   │   └── utils/              # jwt, password, audit
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── vitest.config.ts
│   └── Dockerfile (multi-stage)
└── frontend/
    ├── src/
    │   ├── App.tsx, main.tsx
    │   ├── api/                # axios calls por módulo
    │   ├── components/
    │   │   ├── ui/             # button, input, dialog, table, select, badge, skeleton, dropdown, confirm
    │   │   ├── Sidebar.tsx     # colapsable + tooltips
    │   │   ├── Topbar.tsx      # breadcrumbs + tema + menú usuario
    │   │   ├── NProgressBar.tsx
    │   │   └── ErrorBoundary.tsx
    │   ├── hooks/useDebounce.ts
    │   ├── layouts/AppLayout.tsx
    │   ├── lib/                # api, utils (cn, formatDate)
    │   ├── pages/              # todas las páginas
    │   ├── store/              # auth, theme, ui (zustand)
    │   ├── styles/             # CSS con tokens HSL y dark mode
    │   └── types/
    └── Dockerfile (multi-stage con nginx en prod)
```

## Arranque rápido

```bash
cd farmacia-unas
cp .env.example .env

docker compose up -d --build
docker compose exec backend npx prisma migrate dev --name init
docker compose exec backend npm run prisma:seed
```

| Servicio   | URL                              |
|------------|----------------------------------|
| Frontend   | http://localhost:5173            |
| Backend    | http://localhost:4000            |
| API docs   | http://localhost:4000/api/docs   |
| Health     | http://localhost:4000/api/health |
| Postgres   | localhost:5432                   |

**Credenciales iniciales:** `admin@unas.edu.pe` / `admin123`

## Comandos útiles

```bash
# Backend
docker compose exec backend npm test                # tests
docker compose exec backend npm run prisma:studio   # GUI de la BD
docker compose exec backend npx prisma migrate dev  # nueva migración

# Frontend
docker compose exec frontend npm run lint           # typecheck

# Logs
docker compose logs -f backend
docker compose logs -f frontend

# Reset total (borra BD)
docker compose down -v
```

## Endpoints principales

```
POST   /api/auth/login              · Login (rate limit: 10/15min)
POST   /api/auth/refresh            · Rotar tokens
POST   /api/auth/logout             · Revocar refresh token
GET    /api/auth/me                 · Perfil
POST   /api/auth/change-password    · Cambio de contraseña

GET    /api/usuarios                · ADMIN
POST   /api/usuarios                · ADMIN

GET    /api/pacientes?q=&tipo=
GET    /api/medicamentos?q=&page=&pageSize=
GET    /api/categorias
GET    /api/proveedores

GET    /api/inventario/lotes
POST   /api/inventario/lotes
GET    /api/inventario/stock-critico
GET    /api/inventario/por-vencer?dias=90

GET    /api/entregas
POST   /api/entregas                · FEFO automático
GET    /api/entregas/:id
POST   /api/entregas/:id/anular

GET    /api/reportes/dashboard
GET    /api/reportes/entregas-por-dia?dias=30
GET    /api/reportes/entregas-por-tipo?dias=30
GET    /api/reportes/top-medicamentos?limit=10&dias=90
GET    /api/reportes/stock-por-categoria
```

## Seguridad

- Helmet (cabeceras seguras)
- CORS con origen configurable
- Rate limiting global + específico en login
- JWT con secretos separados para access/refresh
- Refresh tokens almacenados en BD y revocables
- Roles aplicados por endpoint (`requireRole(...)`)
- Auditoría de acciones sensibles
- Validación Zod en todos los inputs

## Desarrollo

```bash
# En la raíz del workspace
npm install   # instala husky + lint-staged + prettier
npm run prepare

# Hooks pre-commit corren prettier sobre archivos modificados
```

## Roadmap futuro

- [ ] Órdenes de compra con recepción que genera lotes automáticamente
- [ ] Importación masiva de pacientes desde CSV
- [ ] Exportar reportes a Excel/PDF
- [ ] Notificaciones (email/in-app) de stock bajo y vencimientos
- [ ] Logo institucional UNAS en sidebar/login
- [ ] PWA / instalación móvil

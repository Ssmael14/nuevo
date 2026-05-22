# Sistema de Administración de Farmacia — UNAS

Sistema web para la administración de la farmacia de la **Universidad Nacional Agraria de la Selva**.
La farmacia **no vende** medicamentos: los **entrega** a alumnos, docentes y personal administrativo.

## Stack

- **Backend:** Node.js + Express + TypeScript + Prisma ORM
- **Frontend:** React + Vite + TypeScript + TailwindCSS
- **Base de datos:** PostgreSQL 16
- **Orquestación:** Docker + Docker Compose

## Módulos

1. **Usuarios y roles** — Admin, Farmacéutico, Almacenero, Auxiliar
2. **Pacientes** — Alumnos, docentes y administrativos
3. **Medicamentos** — Catálogo con categorías y presentaciones
4. **Inventario por lotes** — Control de stock y fechas de vencimiento
5. **Entregas** — Dispensación de medicamentos (no ventas)
6. **Proveedores y órdenes de compra**
7. **Reportes** — Stock crítico, vencimientos, entregas por período

## Estructura

```
farmacia-unas/
├── docker-compose.yml      # Orquestación de los 3 servicios
├── .env.example            # Variables de entorno de ejemplo
├── backend/                # API REST (Express + Prisma)
│   ├── src/
│   ├── prisma/schema.prisma
│   └── Dockerfile
├── frontend/               # SPA (React + Vite)
│   ├── src/
│   └── Dockerfile
└── db/init/                # Scripts SQL de inicialización opcionales
```

## Arranque rápido

```bash
# 1. Clonar y entrar al proyecto
cd farmacia-unas

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar todos los servicios
docker compose up -d --build

# 4. Aplicar migraciones de la base de datos
docker compose exec backend npx prisma migrate dev --name init

# 5. Cargar datos iniciales (usuario admin + categorías)
docker compose exec backend npm run prisma:seed
```

Servicios disponibles:

| Servicio  | URL                       |
|-----------|---------------------------|
| Frontend  | http://localhost:5173     |
| Backend   | http://localhost:4000     |
| API health| http://localhost:4000/api/health |
| Postgres  | localhost:5432            |

**Credenciales iniciales:** `admin@unas.edu.pe` / `admin123` (cambiar en producción).

## Comandos útiles

```bash
# Ver logs
docker compose logs -f backend
docker compose logs -f frontend

# Reiniciar un servicio
docker compose restart backend

# Acceder a la base de datos
docker compose exec db psql -U farmacia -d farmacia_unas

# Prisma Studio (GUI de la BD)
docker compose exec backend npx prisma studio

# Detener todo
docker compose down

# Detener y borrar volúmenes (¡borra la BD!)
docker compose down -v
```

## Endpoints disponibles

| Método | Ruta                       | Auth        | Descripción                       |
|--------|----------------------------|-------------|-----------------------------------|
| GET    | `/api/health`              | público     | Estado de la API y BD             |
| POST   | `/api/auth/login`          | público     | Iniciar sesión, devuelve JWT      |
| GET    | `/api/auth/me`             | autenticado | Perfil del usuario actual         |
| GET    | `/api/categorias`          | autenticado | Listar categorías                 |
| POST   | `/api/categorias`          | ADMIN/FARM. | Crear categoría                   |
| PUT    | `/api/categorias/:id`      | ADMIN/FARM. | Actualizar                        |
| DELETE | `/api/categorias/:id`      | ADMIN       | Eliminar                          |
| GET    | `/api/medicamentos`        | autenticado | Listar (paginado, búsqueda)       |
| POST   | `/api/medicamentos`        | ADMIN/FARM. | Crear medicamento                 |
| PUT    | `/api/medicamentos/:id`    | ADMIN/FARM. | Actualizar                        |
| DELETE | `/api/medicamentos/:id`    | ADMIN       | Eliminar (soft si tiene lotes)    |

## Roadmap

- [x] Estructura inicial del proyecto con Docker
- [x] Esquema de base de datos (Prisma)
- [x] Health check de API
- [x] Autenticación JWT (login + middleware de roles)
- [x] CRUD de categorías
- [x] CRUD de medicamentos (con paginación, búsqueda y stock total)
- [x] Frontend con login, layout protegido y dashboard
- [ ] Gestión de inventario por lotes (ingresos, vencimientos)
- [ ] CRUD de pacientes
- [ ] Registro de entregas con descuento de stock
- [ ] CRUD de proveedores y órdenes de compra
- [ ] Reportes y dashboard avanzado

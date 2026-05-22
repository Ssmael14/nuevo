/**
 * OpenAPI document. Por simplicidad esta hardcoded;
 * en una segunda fase podemos generarlo desde los Zod schemas
 * con @asteasolutions/zod-to-openapi.
 */
export const openapiDoc = {
  openapi: '3.0.3',
  info: {
    title: 'Farmacia UNAS API',
    version: '0.2.0',
    description: 'API para el sistema de administracion de la farmacia universitaria.',
  },
  servers: [{ url: '/api', description: 'Servidor actual' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: { summary: 'Estado de la API y la BD', security: [], responses: { 200: { description: 'OK' } } },
    },
    '/auth/login': {
      post: {
        summary: 'Iniciar sesion',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'OK' }, 401: { description: 'Credenciales invalidas' } },
      },
    },
    '/auth/refresh': { post: { summary: 'Refrescar tokens', security: [] } },
    '/auth/me': { get: { summary: 'Perfil del usuario actual' } },
    '/usuarios': {
      get: { summary: 'Listar usuarios (ADMIN)' },
      post: { summary: 'Crear usuario (ADMIN)' },
    },
    '/categorias': {
      get: { summary: 'Listar categorias' },
      post: { summary: 'Crear categoria' },
    },
    '/medicamentos': {
      get: { summary: 'Listar medicamentos (paginado, con stock)' },
      post: { summary: 'Crear medicamento' },
    },
    '/pacientes': {
      get: { summary: 'Listar pacientes' },
      post: { summary: 'Crear paciente' },
    },
    '/proveedores': {
      get: { summary: 'Listar proveedores' },
      post: { summary: 'Crear proveedor' },
    },
    '/inventario/lotes': {
      get: { summary: 'Listar lotes' },
      post: { summary: 'Ingresar lote (aumenta stock)' },
    },
    '/inventario/stock-critico': { get: { summary: 'Medicamentos con stock bajo el minimo' } },
    '/inventario/por-vencer': { get: { summary: 'Lotes por vencer' } },
    '/entregas': {
      get: { summary: 'Listar entregas' },
      post: { summary: 'Crear entrega (FEFO automatico)' },
    },
    '/entregas/{id}/anular': { post: { summary: 'Anular entrega y devolver stock' } },
    '/reportes/dashboard': { get: { summary: 'Resumen general' } },
    '/reportes/entregas-por-dia': { get: { summary: 'Serie temporal de entregas' } },
    '/reportes/entregas-por-tipo': { get: { summary: 'Entregas por tipo de paciente' } },
    '/reportes/top-medicamentos': { get: { summary: 'Top medicamentos mas entregados' } },
    '/reportes/stock-por-categoria': { get: { summary: 'Stock total por categoria' } },
  },
};

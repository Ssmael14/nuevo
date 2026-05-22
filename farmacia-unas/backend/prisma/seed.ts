import { PrismaClient, RolUsuario } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[seed] Iniciando carga de datos base...');

  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@unas.edu.pe' },
    update: {},
    create: {
      nombres: 'Administrador',
      apellidos: 'Sistema',
      email: 'admin@unas.edu.pe',
      passwordHash,
      rol: RolUsuario.ADMIN,
    },
  });
  console.log(`[seed] Usuario admin: ${admin.email} (password: admin123)`);

  const categorias = [
    { nombre: 'Analgesicos', descripcion: 'Medicamentos para el dolor' },
    { nombre: 'Antibioticos', descripcion: 'Medicamentos antibacterianos' },
    { nombre: 'Antiinflamatorios', descripcion: 'Antiinflamatorios AINEs' },
    { nombre: 'Antipireticos', descripcion: 'Reductores de fiebre' },
    { nombre: 'Antigripales', descripcion: 'Tratamiento sintomatico gripe/resfrio' },
    { nombre: 'Vitaminas', descripcion: 'Suplementos vitaminicos' },
    { nombre: 'Antiacidos', descripcion: 'Tratamiento gastrico' },
    { nombre: 'Topicos', descripcion: 'Cremas y ungüentos' },
  ];

  for (const cat of categorias) {
    await prisma.categoria.upsert({
      where: { nombre: cat.nombre },
      update: {},
      create: cat,
    });
  }
  console.log(`[seed] Categorias creadas: ${categorias.length}`);

  await prisma.configuracion.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      nombreInstitucion: 'Universidad Nacional Agraria de la Selva',
      nombreFarmacia: 'Farmacia UNAS',
      direccion: 'Av. Universitaria s/n, Tingo Maria, Peru',
      rucInstitucion: '20171018901',
      mostrarDemoLogin: true,
      diasAlertaVencimiento: 90,
    },
  });
  console.log('[seed] Configuracion inicializada');

  console.log('[seed] Completado.');
}

main()
  .catch((e) => {
    console.error('[seed] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { prisma } from '../../config/db.js';

export async function dashboard() {
  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);
  const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const en60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const [
    totalMedicamentos,
    totalPacientes,
    entregasHoy,
    entregasMes,
    lotesPorVencer,
  ] = await Promise.all([
    prisma.medicamento.count({ where: { activo: true } }),
    prisma.paciente.count({ where: { activo: true } }),
    prisma.entrega.count({ where: { fecha: { gte: hoyInicio }, estado: 'ENTREGADA' } }),
    prisma.entrega.count({ where: { fecha: { gte: hace30 }, estado: 'ENTREGADA' } }),
    prisma.lote.count({
      where: { fechaVencimiento: { lte: en60, gte: new Date() }, cantidadActual: { gt: 0 } },
    }),
  ]);

  const medicamentos = await prisma.medicamento.findMany({
    where: { activo: true },
    include: { lotes: { select: { cantidadActual: true } } },
  });
  const stockBajo = medicamentos.filter(
    (m) => m.lotes.reduce((a, l) => a + l.cantidadActual, 0) < m.stockMinimo,
  ).length;

  return {
    totalMedicamentos,
    totalPacientes,
    entregasHoy,
    entregasMes,
    lotesPorVencer,
    medicamentosStockBajo: stockBajo,
  };
}

export async function entregasPorDia(dias = 30) {
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  const rows = await prisma.$queryRaw<{ dia: Date; cantidad: bigint }[]>`
    SELECT date_trunc('day', fecha) as dia, COUNT(*)::bigint as cantidad
    FROM entregas
    WHERE fecha >= ${desde} AND estado = 'ENTREGADA'
    GROUP BY dia
    ORDER BY dia ASC
  `;
  return rows.map((r) => ({
    dia: r.dia.toISOString().slice(0, 10),
    cantidad: Number(r.cantidad),
  }));
}

export async function entregasPorTipoPaciente(dias = 30) {
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  const rows = await prisma.$queryRaw<{ tipo: string; cantidad: bigint }[]>`
    SELECT p.tipo, COUNT(*)::bigint as cantidad
    FROM entregas e
    JOIN pacientes p ON p.id = e."pacienteId"
    WHERE e.fecha >= ${desde} AND e.estado = 'ENTREGADA'
    GROUP BY p.tipo
  `;
  return rows.map((r) => ({ tipo: r.tipo, cantidad: Number(r.cantidad) }));
}

export async function topMedicamentos(limit = 10, dias = 90) {
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  const rows = await prisma.$queryRaw<
    { id: string; codigo: string; nombre: string; total: bigint }[]
  >`
    SELECT m.id, m.codigo, m.nombre, SUM(de.cantidad)::bigint as total
    FROM detalles_entrega de
    JOIN medicamentos m ON m.id = de."medicamentoId"
    JOIN entregas e ON e.id = de."entregaId"
    WHERE e.fecha >= ${desde} AND e.estado = 'ENTREGADA'
    GROUP BY m.id, m.codigo, m.nombre
    ORDER BY total DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({ ...r, total: Number(r.total) }));
}

export async function stockPorCategoria() {
  const rows = await prisma.$queryRaw<{ categoria: string; stock: bigint }[]>`
    SELECT COALESCE(c.nombre, 'Sin categoria') as categoria, SUM(l."cantidadActual")::bigint as stock
    FROM lotes l
    JOIN medicamentos m ON m.id = l."medicamentoId"
    LEFT JOIN categorias c ON c.id = m."categoriaId"
    GROUP BY c.nombre
    ORDER BY stock DESC
  `;
  return rows.map((r) => ({ categoria: r.categoria, stock: Number(r.stock) }));
}

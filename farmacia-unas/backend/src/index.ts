import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/db.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`[backend] API escuchando en http://localhost:${env.port}`);
  console.log(`[backend] Entorno: ${env.nodeEnv}`);
});

async function shutdown(signal: string) {
  console.log(`\n[backend] Recibido ${signal}, cerrando...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

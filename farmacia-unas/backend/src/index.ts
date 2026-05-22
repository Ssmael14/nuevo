import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/db.js';
import { logger } from './config/logger.js';

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info(`API escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
  logger.info(`Docs: http://localhost:${env.port}/api/docs`);
});

async function shutdown(signal: string) {
  logger.info(`Recibido ${signal}, cerrando...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

import pino from 'pino';
import { env, isProduction } from './env.js';

export const logger = pino({
  level: env.logLevel,
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
});

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import {SeqTransport} from "@datalust/winston-seq";


/**
 * Create a logger for the application using Winston instead of the built-in nestjs logger.
 * Allows for logging to multiple transports, such as the console and Seq, or modifying the log format.
 */
const createLogger = () => WinstonModule.createLogger({
  level: 'debug',
  format: winston.format.combine(   /* This is required to get errors to log with stack traces. See https://github.com/winstonjs/winston/issues/1498 */
     winston.format.errors({stack: true}),
     winston.format.json(),
  ),
  defaultMeta: {
    Application: 'DDWV_beslissing',
    Instance: process.env.INSTANCE || 'Local',
    Environment: process.env.NODE_ENV || 'Local',
  },
  transports: [
    // log everything to the console
    new winston.transports.Console({
      format: winston.format.combine(
         winston.format.colorize({
           all: true,
         }),
         winston.format.simple(),
      ),
    }),
    new SeqTransport({
      serverUrl: process.env.LOGGER_SERVER_URL || 'http://localhost:5341',
      apiKey: process.env.LOGGER_API_KEY,
      onError: (e => {
        console.error(e);
      }),
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
});


async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: createLogger(),
  });
  const logger = new Logger('Application');

  logger.log('DDWV_beslissing started as background worker');

  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, shutting down gracefully...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start application:', err);
  process.exit(1);
});

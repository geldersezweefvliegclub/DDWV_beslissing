import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import {TwentyFourHourLogger} from "./common/twenty-four-hour-logger";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: new TwentyFourHourLogger(),
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

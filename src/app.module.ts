import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import * as Joi from 'joi';
import { HeliosModule } from './helios/helios.module';
import { GoogleModule } from './google/google.module';
import { DdwvBeslissingModule } from './ddwv_beslissing/ddwv-beslissing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        HELIOS_CREDENTIAL_FILE: Joi.string().optional(),
        GOOGLE_CREDENTIALS_PATH: Joi.string().required(),
        GOOGLE_ADMIN_EMAIL: Joi.string().email().required(),
        VERZENDEN_EMAIL: Joi.string().optional(),
        CRON_DDWV_BESLISSING: Joi.string().optional(),
        CRON_TIMEZONE: Joi.string().optional(),
        DDWV_ALWAYS_TO: Joi.string().allow('').optional(),
        DDWV_CREW_ALWAYS_TO: Joi.string().allow('').optional(),
        DDWV_CLUB_LIDTYPE_ID: Joi.number().optional(),
        DDWV_ERROR_EMAIL: Joi.string().email().optional()
      })
    }),
    ScheduleModule.forRoot(),
    HeliosModule,
    GoogleModule,
    DdwvBeslissingModule
  ]
})
export class AppModule {}

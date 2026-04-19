import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DdwvBeslissingWorkflowService } from './ddwv-beslissing-workflow.service';

@Injectable()
export class DdwvBeslissingScheduler {
  private readonly logger = new Logger(DdwvBeslissingScheduler.name);

  constructor(private readonly workflow: DdwvBeslissingWorkflowService) {
    this.logger.log(`Cron expression: ${process.env.CRON_DDWV_BESLISSING || '0 21 * * *'}`);
  }

  @Cron(process.env.CRON_DDWV_BESLISSING || '* * * * *', {
    timeZone: process.env.CRON_TIMEZONE || 'Europe/Amsterdam'
  })
  async handleCron(): Promise<void> {
    this.logger.log('Aanroepen DDWV beslissing cron');
    await this.workflow.run();
  }
}

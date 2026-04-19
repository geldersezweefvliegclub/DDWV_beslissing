import { Module } from '@nestjs/common';
import { DdwvBeslissingScheduler } from './ddwv-beslissing.scheduler';
import { DdwvBeslissingWorkflowService } from './ddwv-beslissing-workflow.service';
import { DdwvMailBuilder } from './ddwv-mail.builder';
import { HeliosModule } from '../helios/helios.module';
import { GoogleModule } from '../google/google.module';

@Module({
  imports: [HeliosModule, GoogleModule],
  providers: [DdwvBeslissingScheduler, DdwvBeslissingWorkflowService, DdwvMailBuilder]
})
export class DdwvBeslissingModule {}

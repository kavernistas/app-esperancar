import { Module } from '@nestjs/common';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { AuditModule } from '../audit/audit.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [AuditModule, EventsModule],
  controllers: [MissionsController],
  providers: [MissionsService],
  exports: [MissionsService],
})
export class MissionsModule {}

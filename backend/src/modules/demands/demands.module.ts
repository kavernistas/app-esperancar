import { Module } from '@nestjs/common';
import { DemandsController } from './demands.controller';
import { DemandsService } from './demands.service';
import { AuditModule } from '../audit/audit.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [AuditModule, EventsModule],
  controllers: [DemandsController],
  providers: [DemandsService],
  exports: [DemandsService],
})
export class DemandsModule {}

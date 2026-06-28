import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AccessControlModule, AuditModule],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}

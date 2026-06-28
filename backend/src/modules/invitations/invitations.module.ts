import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AccessControlModule, AuditModule],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}

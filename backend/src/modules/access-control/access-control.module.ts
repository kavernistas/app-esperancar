import { Module } from '@nestjs/common';
import { AccessControlService, PermissionsGuard } from './access-control.service';

@Module({
  providers: [AccessControlService, PermissionsGuard],
  exports: [AccessControlService, PermissionsGuard],
})
export class AccessControlModule {}

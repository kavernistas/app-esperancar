import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AccessControlModule, AuditModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

import { Module } from '@nestjs/common';
import { TseController } from './tse.controller';
import { TseService } from './tse.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [TseController],
  providers: [TseService],
  exports: [TseService],
})
export class TseModule {}

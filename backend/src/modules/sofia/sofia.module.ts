import { Module } from '@nestjs/common';
import { SofiaController } from './sofia.controller';
import { SofiaService } from './sofia.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [SofiaController],
  providers: [SofiaService],
  exports: [SofiaService],
})
export class SofiaModule {}

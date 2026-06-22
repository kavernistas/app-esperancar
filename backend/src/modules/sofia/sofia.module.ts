import { Module } from '@nestjs/common';
import { SofiaController } from './sofia.controller';
import { SofiaService } from './sofia.service';

@Module({
  controllers: [SofiaController],
  providers: [SofiaService],
  exports: [SofiaService],
})
export class SofiaModule {}

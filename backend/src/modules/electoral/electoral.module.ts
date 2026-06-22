import { Module } from '@nestjs/common';
import { ElectoralController } from './electoral.controller';
import { ElectoralService } from './electoral.service';

@Module({
  controllers: [ElectoralController],
  providers: [ElectoralService],
  exports: [ElectoralService],
})
export class ElectoralModule {}

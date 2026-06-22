import { Module } from '@nestjs/common';
import { CampaignController } from './campaigns.controller';
import { CampaignService } from './campaigns.service';

@Module({
  controllers: [CampaignController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}

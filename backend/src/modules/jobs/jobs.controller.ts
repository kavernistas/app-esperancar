import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JobsService } from './jobs.service';

@ApiTags('Jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/jobs')
export class JobsController {
  constructor(private readonly service: JobsService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Listar todos os jobs agendados' })
  async getAllJobs() {
    return this.service.getAllJobs();
  }

  @Get(':name')
  @Roles('admin')
  @ApiOperation({ summary: 'Obter status de um job' })
  async getJob(@Param('name') name: string) {
    return this.service.getJob(name);
  }

  @Post(':name/run')
  @Roles('admin')
  @ApiOperation({ summary: 'Executar job manualmente' })
  async runJob(@Param('name') name: string, @CurrentUser() user: any) {
    return this.service.runJob(name, user?.id);
  }

  @Patch(':name/toggle')
  @Roles('admin')
  @ApiOperation({ summary: 'Ativar/desativar job' })
  async toggleJob(@Param('name') name: string, @Body() body: { enabled: boolean }) {
    return this.service.toggleJob(name, body.enabled);
  }
}

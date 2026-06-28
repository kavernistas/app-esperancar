import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CampaignService } from './campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto, ListCampaignDto } from './dto';

@ApiTags('Campaign')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly service: CampaignService) {}

  @Get()
  @ApiOperation({ summary: 'Listar campaigns' })
  async findAll(@Query() query: ListCampaignDto, @CurrentUser() user: any) {
    return this.service.findAll(query, user?.organization_id);
  }

  @Get('active/current')
  @ApiOperation({ summary: 'Obter campanha ativa do usuário' })
  async getActive(@CurrentUser() user: any) {
    return this.service.getActiveCampaign(user?.id, user?.organization_id, user?.active_campaign_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter campaign por ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user?.organization_id);
  }

  @Post()
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Criar campaign' })
  async create(@Body() dto: CreateCampaignDto, @CurrentUser() user: any) {
    return this.service.create(dto, user?.organization_id, user?.id, user?.full_name || user?.email);
  }

  @Post(':id/activate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Ativar campaign para o usuário atual' })
  async activate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.activate(id, user?.id, user?.organization_id, user?.full_name || user?.email);
  }

  @Patch(':id')
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Atualizar campaign' })
  async update(@Param('id') id: string, @Body() dto: UpdateCampaignDto, @CurrentUser() user: any) {
    return this.service.update(id, dto, user?.organization_id, user?.id, user?.full_name || user?.email);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Excluir campaign (soft delete)' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user?.organization_id, user?.id, user?.full_name || user?.email);
  }
}

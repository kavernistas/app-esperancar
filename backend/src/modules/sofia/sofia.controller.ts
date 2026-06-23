import { Controller, Post, Get, Body, Query, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { SofiaService } from './sofia.service';
import { SofiaAnalyzeDto, SofiaTseAnalysisDto, SofiaGamificationInsightDto, SofiaMissionRecommendationDto } from './dto';

@ApiTags('Sofia IA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sofia')
export class SofiaController {
  constructor(private readonly service: SofiaService) {}

  @Post('analyze')
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Analise IA generica' })
  async analyze(@Body() dto: SofiaAnalyzeDto, @CurrentUser() user: any) {
    return this.service.analyze({
      ...dto,
      userId: user?.id,
      module: 'general',
    });
  }

  @Post('analyze/tse')
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Analise IA de dados TSE' })
  async analyzeTse(@Body() dto: SofiaTseAnalysisDto, @CurrentUser() user: any) {
    return this.service.analyzeTseData({
      ...dto,
      userId: user?.id,
    });
  }

  @Post('gamification/insight')
  @Roles('admin', 'coordenador', 'lideranca')
  @ApiOperation({ summary: 'Insight IA de gamificacao' })
  async gamificationInsight(@Body() dto: SofiaGamificationInsightDto, @CurrentUser() user: any) {
    return this.service.getGamificationInsight({
      ...dto,
      userId: user?.id,
    });
  }

  @Post('missions/recommend')
  @Roles('admin', 'coordenador')
  @ApiOperation({ summary: 'Recomendacao IA de missoes' })
  async recommendMissions(@Body() dto: SofiaMissionRecommendationDto, @CurrentUser() user: any) {
    return this.service.recommendMissions({
      ...dto,
      userId: user?.id,
    });
  }

  @Get('history')
  @Roles('admin')
  @ApiOperation({ summary: 'Historico de prompts' })
  async getHistory(@Query() query: any, @CurrentUser() user: any) {
    return this.service.getHistory({ ...query, userId: user?.id });
  }

  @Get('providers')
  @ApiOperation({ summary: 'Providers LLM disponiveis' })
  async getProviders() {
    return this.service.getProviders();
  }

  @Delete('cache')
  @Roles('admin')
  @ApiOperation({ summary: 'Limpar cache de respostas' })
  async clearCache() {
    return this.service.clearCache();
  }
}

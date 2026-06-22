import { IsString, IsOptional, IsArray, IsNumber, IsEnum, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SofiaAnalyzeDto {
  @ApiProperty({ example: 'Analise os dados eleitorais de SP/2024' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ description: 'Contexto adicional para a analise' })
  @IsOptional() @IsString()
  context?: string;

  @ApiPropertyOptional({ description: 'Prompt do sistema (personalidade)' })
  @IsOptional() @IsString()
  systemPrompt?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  useCache?: boolean = true;

  @ApiPropertyOptional({ default: 0.7 })
  @IsOptional() @IsNumber()
  temperature?: number = 0.7;

  @ApiPropertyOptional({ default: 2000 })
  @IsOptional() @IsNumber()
  maxTokens?: number = 2000;
}

export class SofiaTseAnalysisDto {
  @ApiProperty({ example: 2024 })
  @Type(() => Number) @IsNumber()
  ano: number;

  @ApiProperty({ example: 'SP' })
  @IsString()
  uf: string;

  @ApiProperty({ example: 'vereador' })
  @IsString()
  cargo: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  candidato?: string;

  @ApiProperty({ description: 'Dados TSE para analise', type: [Object] })
  @IsArray()
  tseData: any[];
}

export class SofiaGamificationInsightDto {
  @ApiProperty({ description: 'Perfil de gamificacao' })
  @IsObject()
  profile: any;

  @ApiPropertyOptional()
  @IsOptional() @IsArray()
  recentActivity?: any[];
}

export class SofiaMissionRecommendationDto {
  @ApiProperty({ description: 'Perfil da lideranca' })
  @IsObject()
  leaderProfile: any;

  @ApiPropertyOptional()
  @IsOptional() @IsArray()
  availableContacts?: any[];

  @ApiPropertyOptional()
  @IsOptional() @IsArray()
  recentDemands?: any[];
}

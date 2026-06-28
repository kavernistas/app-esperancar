import { IsString, IsOptional, IsInt, IsEnum, IsDateString, Length, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum CampaignType {
  MUNICIPAL = 'MUNICIPAL',
  ESTADUAL = 'ESTADUAL',
  FEDERAL = 'FEDERAL',
  SENATOR = 'SENATOR',
  PRESIDENTE = 'PRESIDENTE',
}

export enum CampaignPosition {
  PREFEITO = 'PREFEITO',
  VEREADOR = 'VEREADOR',
  DEPUTADO_ESTADUAL = 'DEPUTADO_ESTADUAL',
  DEPUTADO_FEDERAL = 'DEPUTADO_FEDERAL',
  SENADOR = 'SENADOR',
  GOVERNADOR = 'GOVERNADOR',
  PRESIDENTE = 'PRESIDENTE',
}

export enum CampaignStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateCampaignDto {
  @ApiProperty({ example: 'Campanha 2026' })
  @IsString() @Length(2, 200)
  name: string;

  @ApiPropertyOptional({ enum: CampaignType, default: 'MUNICIPAL' })
  @IsOptional() @IsEnum(CampaignType)
  type?: CampaignType;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional() @Type(() => Number) @IsInt()
  year?: number;

  @ApiPropertyOptional({ enum: CampaignPosition })
  @IsOptional() @IsEnum(CampaignPosition)
  position?: CampaignPosition;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  candidate_name?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  party?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  coalition?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  vote_goal?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @Type(() => Number) @Min(0)
  budget?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  start_date?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  end_date?: string;
}

export class UpdateCampaignDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString() @Length(2, 200)
  name?: string;

  @ApiPropertyOptional({ enum: CampaignType })
  @IsOptional() @IsEnum(CampaignType)
  type?: CampaignType;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt()
  year?: number;

  @ApiPropertyOptional({ enum: CampaignPosition })
  @IsOptional() @IsEnum(CampaignPosition)
  position?: CampaignPosition;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  candidate_name?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  party?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  coalition?: string;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  vote_goal?: number;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @Min(0)
  budget?: number;

  @ApiPropertyOptional({ enum: CampaignStatus })
  @IsOptional() @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  start_date?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  end_date?: string;
}

export class ListCampaignDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500)
  limit?: number = 50;

  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  sortBy?: string = 'created_at';

  @IsOptional() @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

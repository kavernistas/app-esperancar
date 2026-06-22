import { IsString, IsEmail, IsOptional, IsInt, IsEnum, IsNumber, IsDateString, Length, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum DemandType {
  HEALTH = 'HEALTH', EDUCATION = 'EDUCATION', INFRASTRUCTURE = 'INFRASTRUCTURE',
  ZELADORIA = 'ZELADORIA', ILUMINACAO = 'ILUMINACAO', TRANSPORT = 'TRANSPORT',
  SOCIAL = 'SOCIAL', SECURITY = 'SECURITY', HOUSING = 'HOUSING',
  EMPLOYMENT = 'EMPLOYMENT', DOCUMENTACAO = 'DOCUMENTACAO', OTHER = 'OTHER',
}

export enum DemandPriority { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH', URGENT = 'URGENT' }
export enum DemandStatus { OPEN = 'OPEN', IN_PROGRESS = 'IN_PROGRESS', RESOLVED = 'RESOLVED', PENDING = 'PENDING', CANCELLED = 'CANCELLED' }

export class CreateDemandDto {
  @ApiProperty({ example: 'Buraco na rua principal' })
  @IsString() @Length(3, 300)
  title: string;

  @ApiProperty({ enum: DemandType })
  @IsEnum(DemandType)
  type: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Joao Silva' })
  @IsOptional() @IsString()
  requester_name?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  requester_phone?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsEmail()
  requester_email?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Sao Paulo' })
  @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional() @IsString()
  neighborhood?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ enum: DemandPriority, default: 'MEDIUM' })
  @IsOptional() @IsEnum(DemandPriority)
  priority?: string;

  @ApiPropertyOptional({ enum: DemandStatus, default: 'OPEN' })
  @IsOptional() @IsEnum(DemandStatus)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  responsible?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  due_date?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  supporter_id?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  supporter_name?: string;
}

export class UpdateDemandDto extends CreateDemandDto {}

export class ListDemandDto {
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

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsString()
  type?: string;

  @IsOptional() @IsString()
  priority?: string;

  @IsOptional() @IsString()
  city?: string;

  @IsOptional() @IsString()
  neighborhood?: string;
}

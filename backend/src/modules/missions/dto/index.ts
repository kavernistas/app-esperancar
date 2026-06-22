import { IsString, IsOptional, IsInt, IsEnum, IsBoolean, IsDateString, IsNumber, Length, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum MissionType {
  REGISTER_SUPPORTERS = 'REGISTER_SUPPORTERS', VISIT_REGION = 'VISIT_REGION',
  MOBILIZE_MEETING = 'MOBILIZE_MEETING', COLLECT_DEMANDS = 'COLLECT_DEMANDS',
  CONFIRM_ATTENDANCE = 'CONFIRM_ATTENDANCE', SHARE_CONTENT = 'SHARE_CONTENT',
  ORGANIZE_LOCAL_NUCLEUS = 'ORGANIZE_LOCAL_NUCLEUS', UPDATE_TERRITORIAL_DATA = 'UPDATE_TERRITORIAL_DATA',
  FORWARD_SERVICE = 'FORWARD_SERVICE', OTHER = 'OTHER',
}
export enum MissionPriority { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH', URGENT = 'URGENT' }
export enum MissionStatus { PENDING = 'PENDING', IN_PROGRESS = 'IN_PROGRESS', COMPLETED = 'COMPLETED', OVERDUE = 'OVERDUE', CANCELLED = 'CANCELLED' }

export class CreateMissionDto {
  @ApiProperty({ example: 'Cadastrar 20 apoiadores' })
  @IsString() @Length(3, 300)
  title: string;

  @ApiProperty({ enum: MissionType })
  @IsEnum(MissionType)
  type: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  neighborhood?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  leader_id?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  leader_name?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ enum: MissionPriority, default: 'MEDIUM' })
  @IsOptional() @IsEnum(MissionPriority)
  priority?: string;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional() @IsInt() @Min(0)
  points?: number;

  @ApiPropertyOptional({ enum: MissionStatus, default: 'PENDING' })
  @IsOptional() @IsEnum(MissionStatus)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  segment?: string;
}

export class UpdateMissionDto extends CreateMissionDto {}

export class ListMissionDto {
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
  leader_id?: string;

  @IsOptional() @IsString()
  priority?: string;
}

import { IsString, IsEmail, IsOptional, IsInt, IsEnum, IsUrl, Length, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum PoliticalStrength {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum LeaderStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateLeaderDto {
  @ApiProperty({ example: 'Maria Santos' })
  @IsString() @Length(2, 200)
  name: string;

  @ApiPropertyOptional({ example: '11999887766' })
  @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'maria@email.com' })
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Sao Paulo' })
  @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional() @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ example: '010' })
  @IsOptional() @IsString()
  electoral_zone?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsInt() @Min(0)
  monthly_goal?: number;

  @ApiPropertyOptional({ enum: PoliticalStrength, default: 'medium' })
  @IsOptional() @IsEnum(PoliticalStrength)
  political_strength?: string;

  @ApiPropertyOptional({ example: 'jovem' })
  @IsOptional() @IsString()
  segment?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  photo_url?: string;

  @ApiPropertyOptional({ enum: LeaderStatusEnum, default: 'ACTIVE' })
  @IsOptional() @IsEnum(LeaderStatusEnum)
  status?: string;
}

export class UpdateLeaderDto extends CreateLeaderDto {}

export class ListLeaderDto {
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
  city?: string;

  @IsOptional() @IsString()
  neighborhood?: string;
}

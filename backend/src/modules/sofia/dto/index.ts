import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, IsDateString, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateSofiaDto {}

export class UpdateSofiaDto {}

export class ListSofiaDto {
  @IsOptional() @IsNumber() @Min(1)
  page?: number = 1;

  @IsOptional() @IsNumber() @Min(1) @Max(500)
  limit?: number = 50;

  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  sortBy?: string = 'created_at';

  @IsOptional() @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

import { IsString, IsEmail, IsOptional, IsEnum, Length, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ example: 'joao@campanha.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'João Silva' })
  @IsOptional() @IsString() @Length(2, 200)
  full_name?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'CHANGE_ME' })
  @IsOptional() @IsString() @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 'OPERADOR' })
  @IsOptional() @IsString()
  role?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsEnum(['ACTIVE', 'INACTIVE', 'PENDING'])
  status?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString() @Length(2, 200)
  full_name?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  role?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsEnum(['ACTIVE', 'INACTIVE', 'PENDING'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MinLength(6)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  active_campaign_id?: string;
}

export class ListUserDto {
  @IsOptional() @Type(() => Number)
  page?: number = 1;

  @IsOptional() @Type(() => Number)
  limit?: number = 50;

  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  sortBy?: string;

  @IsOptional() @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional() @IsEnum(['ACTIVE', 'INACTIVE', 'PENDING'])
  status?: string;

  @IsOptional() @IsString()
  role?: string;

  @IsOptional() @IsString()
  teamId?: string;
}

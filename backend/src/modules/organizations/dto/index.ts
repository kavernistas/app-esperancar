import { IsString, IsOptional, IsEmail, IsEnum, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OrgPlan {
  free = 'free',
  starter = 'starter',
  pro = 'pro',
  enterprise = 'enterprise',
}

export enum OrgStatus {
  active = 'active',
  suspended = 'suspended',
  cancelled = 'cancelled',
}

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Minha Campanha' })
  @IsString() @Length(2, 200)
  name: string;

  @ApiPropertyOptional({ example: 'minha-campanha' })
  @IsOptional() @IsString() @Matches(/^[a-z0-9-]+$/, { message: 'slug deve conter apenas letras minúsculas, números e hífens' })
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  document?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: OrgPlan, default: 'free' })
  @IsOptional() @IsEnum(OrgPlan)
  plan?: OrgPlan;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString() @Length(2, 200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  document?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: OrgPlan })
  @IsOptional() @IsEnum(OrgPlan)
  plan?: OrgPlan;

  @ApiPropertyOptional({ enum: OrgStatus })
  @IsOptional() @IsEnum(OrgStatus)
  status?: OrgStatus;
}

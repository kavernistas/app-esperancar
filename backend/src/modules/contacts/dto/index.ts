import {
  IsString, IsEmail, IsOptional, IsBoolean, IsInt, IsNumber,
  IsEnum, IsArray, IsLatitude, IsLongitude, Min, Max, Length
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export enum SupportIntent {
  APOIADOR = 'apoiador',
  INDECISO = 'indeciso',
  CONTRARIO = 'contrario',
  LIDERANCA_POTENCIAL = 'lideranca_potencial',
}

export enum ContactStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

export class CreateContactDto {
  @ApiProperty({ example: 'Joao Silva' })
  @IsString() @Length(2, 200)
  full_name: string;

  @ApiPropertyOptional({ example: '11999887766' })
  @IsOptional() @IsString() @Length(8, 20)
  phone?: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '01001000' })
  @IsOptional() @IsString() @Length(8, 8)
  cep?: string;

  @ApiPropertyOptional({ example: 'Sao Paulo' })
  @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional() @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'Rua Augusta' })
  @IsOptional() @IsString()
  address_street?: string;

  @ApiPropertyOptional({ example: '100' })
  @IsOptional() @IsString()
  address_number?: string;

  @ApiPropertyOptional({ example: 'Apto 32' })
  @IsOptional() @IsString()
  complement?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional() @IsString() @Length(2, 2)
  state?: string;

  @ApiPropertyOptional({ example: '010' })
  @IsOptional() @IsString()
  electoral_zone?: string;

  @ApiPropertyOptional({ example: '001' })
  @IsOptional() @IsString()
  electoral_section?: string;

  @ApiPropertyOptional({ example: 'Escola Municipal' })
  @IsOptional() @IsString()
  voting_location?: string;

  @ApiPropertyOptional({ example: 'Coordenador' })
  @IsOptional() @IsString()
  position?: string;

  @ApiPropertyOptional({ example: 'jovem' })
  @IsOptional() @IsString()
  segment?: string;

  @ApiPropertyOptional({ enum: SupportIntent, default: 'indeciso' })
  @IsOptional() @IsEnum(SupportIntent)
  support_intent?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  contact_authorized?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean()
  is_leader?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsInt() @Min(0)
  vote_goal?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional() @IsInt() @Min(0) @Max(100)
  engagement_level?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean()
  visual_no_carro?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean()
  visual_na_residencia?: boolean;

  @ApiPropertyOptional({ example: ['jovem', 'centro'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'Contato cadastrado via app' })
  @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ enum: ContactStatusEnum, default: 'ACTIVE' })
  @IsOptional() @IsEnum(ContactStatusEnum)
  status?: string;
}

export class UpdateContactDto extends CreateContactDto {}

export class ListContactDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500)
  limit?: number = 50;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  sortBy?: string = 'created_at';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional() @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  neighborhood?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  is_leader?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  support_intent?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  electoral_zone?: string;
}

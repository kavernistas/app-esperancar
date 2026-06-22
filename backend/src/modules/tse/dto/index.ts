import { IsInt, IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsNumber, Length, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TseDatasetType {
  VOTACAO_SECAO = 'votacao_secao',
  VOTACAO_NOMINAL_MUNZONA = 'votacao_nominal_munzona',
  DETALHE_APURACAO_MUNZONA = 'detalhe_apuracao_munzona',
  PERFIL_ELEITORADO_SECAO = 'perfil_eleitorado_secao',
}

export class TseQueryDto {
  @ApiProperty({ example: 2024 })
  @Type(() => Number) @IsInt() @Min(2000) @Max(2030)
  ano: number;

  @ApiProperty({ example: 'SP' })
  @IsString() @Length(2, 2)
  uf: string;

  @ApiPropertyOptional({ example: 'vereador' })
  @IsOptional() @IsString()
  cargo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  municipio?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  zona?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  secao?: string;

  @ApiPropertyOptional({ description: 'Numero ou nome do candidato' })
  @IsOptional() @IsString()
  candidato?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500)
  limit?: number = 100;

  @ApiPropertyOptional({ default: 'votos' })
  @IsOptional() @IsString()
  sortBy?: string = 'votos';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional() @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class TseBatchRecordDto {
  @IsOptional() @IsInt() turno?: number;
  @IsOptional() @IsString() municipio?: string;
  @IsOptional() @IsString() codigo_municipio?: string;
  @IsOptional() @IsString() zona?: string;
  @IsOptional() @IsString() secao?: string;
  @IsOptional() @IsString() cargo?: string;
  @IsOptional() @IsString() numero_candidato?: string;
  @IsOptional() @IsString() nome_candidato?: string;
  @IsOptional() @IsString() partido?: string;
  @IsOptional() @IsNumber() votos?: number;
  @IsOptional() @IsString() local_votacao?: string;
}

export class TseBatchDto {
  @ApiProperty({ example: 2024 })
  @Type(() => Number) @IsInt()
  ano: number;

  @ApiProperty({ example: 'SP' })
  @IsString() @Length(2, 2)
  uf: string;

  @ApiPropertyOptional({ enum: TseDatasetType })
  @IsOptional() @IsEnum(TseDatasetType)
  dataset_tipo?: string;

  @ApiProperty({ type: [TseBatchRecordDto] })
  @IsArray()
  records: any[];

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  final_batch?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  source_url?: string;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt()
  total_registros?: number;
}

export class TseImportJobDto {
  @ApiProperty({ example: 2024 })
  @Type(() => Number) @IsInt()
  ano: number;

  @ApiProperty({ example: 'SP' })
  @IsString() @Length(2, 2)
  uf: string;

  @ApiProperty({ enum: TseDatasetType })
  @IsEnum(TseDatasetType)
  dataset_tipo: string;

  @ApiProperty({ description: 'URL do arquivo (UploadFile ou CDN TSE)' })
  @IsString()
  file_url: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  municipio?: string;
}

export class TseResolveSourceDto {
  @ApiProperty({ example: 2024 })
  @Type(() => Number) @IsInt()
  ano: number;

  @ApiProperty({ example: 'SP' })
  @IsString() @Length(2, 2)
  uf: string;

  @ApiProperty({ enum: TseDatasetType })
  @IsEnum(TseDatasetType)
  dataset_tipo: string;
}

export class TseDedupDto {
  @ApiProperty({ example: 2024 })
  @Type(() => Number) @IsInt()
  ano: number;

  @ApiProperty({ example: 'SP' })
  @IsString() @Length(2, 2)
  uf: string;
}

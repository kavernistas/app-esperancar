import { IsString, IsOptional, IsArray, IsNumber, IsEnum, ValidateNested, Min, Max, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class WhatsAppContactRefDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  id?: string;

  @ApiProperty({ example: '11999887766' })
  @IsString() @Length(8, 20)
  phone: string;

  @ApiPropertyOptional({ example: 'Joao Silva' })
  @IsOptional() @IsString()
  name?: string;
}

export class WhatsAppSendDto {
  @ApiProperty({ type: [WhatsAppContactRefDto] })
  @IsArray() @ValidateNested({ each: true })
  @Type(() => WhatsAppContactRefDto)
  contacts: WhatsAppContactRefDto[];

  @ApiProperty({ example: 'Ola {nome}! Sua demanda foi atendida.' })
  @IsString() @Length(1, 4000)
  message: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  campaignId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  templateName?: string;

  @ApiPropertyOptional({ default: 1500 })
  @IsOptional() @IsNumber() @Min(0) @Max(10000)
  delayMs?: number = 1500;

  @ApiPropertyOptional({ default: 8 })
  @IsOptional() @IsNumber() @Min(1) @Max(50)
  batchSize?: number = 8;

  @ApiPropertyOptional({ default: 45000 })
  @IsOptional() @IsNumber() @Min(0) @Max(300000)
  batchPauseMs?: number = 45000;
}

export class WhatsAppSingleSendDto {
  @ApiProperty({ example: '11999887766' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Ola! Como posso ajudar?' })
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  campaignId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  templateName?: string;
}

export class WhatsAppLogQueryDto {
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(500)
  limit?: number = 50;

  @IsOptional() @IsString()
  campaignId?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsString()
  sentById?: string;
}

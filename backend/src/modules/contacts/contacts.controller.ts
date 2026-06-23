import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto, ListContactDto } from './dto';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly service: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar contatos com paginacao e filtros' })
  async findAll(@Query() query: ListContactDto, @CurrentUser() user: any) {
    return this.service.findAll(query, user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter contato por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin', 'coordenador', 'lideranca')
  @ApiOperation({ summary: 'Criar novo contato' })
  async create(@Body() dto: CreateContactDto, @CurrentUser() user: any) {
    return this.service.create(dto, user?.id, user?.full_name);
  }

  @Patch(':id')
  @Roles('admin', 'coordenador', 'lideranca')
  @ApiOperation({ summary: 'Atualizar contato' })
  async update(@Param('id') id: string, @Body() dto: UpdateContactDto, @CurrentUser() user: any) {
    return this.service.update(id, dto, user?.id, user?.full_name);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Excluir contato (soft delete)' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user?.id, user?.full_name);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateTipoEventoDto } from './dto/create-tipo-evento.dto';
import { UpdateTipoEventoDto } from './dto/update-tipo-evento.dto';
import { TiposEventoService } from './tipos-evento.service';

@Controller('tipos-evento')
export class TiposEventoController {
  constructor(private readonly tiposEventoService: TiposEventoService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:TIPO_EVENTO')
  async findAll(@Query() query: PaginationQueryDto) {
    return this.tiposEventoService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:TIPO_EVENTO')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tiposEventoService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('CREATE:TIPO_EVENTO')
  async create(@Body() dto: CreateTipoEventoDto) {
    return this.tiposEventoService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:TIPO_EVENTO')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoEventoDto,
  ) {
    return this.tiposEventoService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('DELETE:TIPO_EVENTO')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.tiposEventoService.remove(id);
  }
}

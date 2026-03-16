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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AssignEventoComisionDto } from './dto/assign-evento-comision.dto';
import { CalendarEventosQueryDto } from './dto/calendar-eventos-query.dto';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoAfectacionesDto } from './dto/update-evento-afectaciones.dto';
import { UpdateEventoInscripcionesDto } from './dto/update-evento-inscripciones.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { EventosService } from './eventos.service';

const ADULT_ROLES = [
  'JEFATURA',
  'SECRETARIA_TESORERIA',
  'JEFATURA_RAMA',
  'AYUDANTE_RAMA',
  'INTENDENCIA',
] as const;

@Controller('eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:EVENTO')
  async findAll(@Query() query: PaginationQueryDto) {
    return this.eventosService.findAll(query);
  }

  @Get('options')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:EVENTO')
  async getOptions() {
    return this.eventosService.getOptions();
  }

  @Get('calendar')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:EVENTO')
  async getCalendarEvents(@Query() query: CalendarEventosQueryDto) {
    return this.eventosService.getCalendarEvents(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:EVENTO')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventosService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('CREATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async create(@Body() dto: CreateEventoDto) {
    return this.eventosService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventoDto,
  ) {
    return this.eventosService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('DELETE:EVENTO')
  @Roles('JEFATURA')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.eventosService.remove(id);
  }

  @Get(':id/inscripciones')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:EVENTO')
  async getInscripciones(@Param('id', ParseIntPipe) id: number) {
    return this.eventosService.getInscripciones(id);
  }

  @Patch(':id/inscripciones')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:INSCRIPCION')
  @Roles(...ADULT_ROLES)
  async updateInscripciones(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventoInscripcionesDto,
  ) {
    return this.eventosService.updateInscripciones(id, dto);
  }

  @Patch(':id/afectaciones')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async updateAfectaciones(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventoAfectacionesDto,
  ) {
    return this.eventosService.updateAfectaciones(id, dto);
  }

  @Patch(':id/comision')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async assignComision(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignEventoComisionDto,
  ) {
    return this.eventosService.assignComision(id, dto);
  }
}

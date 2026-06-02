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
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { AssignEventoComisionDto } from './dto/assign-evento-comision.dto';
import { CalendarEventosQueryDto } from './dto/calendar-eventos-query.dto';
import { CreateEventoDto } from './dto/create-evento.dto';
import { EventosQueryDto } from './dto/eventos-query.dto';
import { UpdateEventoAfectacionesDto } from './dto/update-evento-afectaciones.dto';
import { UpdateEventoInscripcionesDto } from './dto/update-evento-inscripciones.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { EventosService } from './eventos.service';

const ADULT_ROLES = [
  'AYUDANTE',
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
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: EventosQueryDto,
  ) {
    return this.eventosService.findAll(req.user!, query);
  }

  @Get('options')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:EVENTO')
  async getOptions(@Request() req: AuthenticatedRequest) {
    return this.eventosService.getOptions(req.user!);
  }

  @Get('calendar')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:EVENTO')
  async getCalendarEvents(
    @Request() req: AuthenticatedRequest,
    @Query() query: CalendarEventosQueryDto,
  ) {
    return this.eventosService.getCalendarEvents(req.user!, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:EVENTO')
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.eventosService.findOne(id, req.user!);
  }

  @Get(':id/export/pdf')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:EVENTO')
  async exportPdf(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const pdf = await this.eventosService.exportPdf(id, req.user!);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${pdf.filename}"`,
    );
    res.send(pdf.buffer);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('CREATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateEventoDto,
  ) {
    return this.eventosService.create(dto, req.user!);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventoDto,
  ) {
    return this.eventosService.update(id, dto, req.user!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('DELETE:EVENTO')
  @Roles(...ADULT_ROLES)
  async remove(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.eventosService.remove(id, req.user!);
  }

  @Get(':id/inscripciones')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:EVENTO')
  async getInscripciones(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.eventosService.getInscripciones(id, req.user!);
  }

  @Patch(':id/inscripciones')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:INSCRIPCION')
  @Roles(...ADULT_ROLES)
  async updateInscripciones(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventoInscripcionesDto,
  ) {
    return this.eventosService.updateInscripciones(id, dto, req.user!);
  }

  @Patch(':id/afectaciones')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async updateAfectaciones(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventoAfectacionesDto,
  ) {
    return this.eventosService.updateAfectaciones(id, dto, req.user!);
  }

  @Patch(':id/comision')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async assignComision(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignEventoComisionDto,
  ) {
    return this.eventosService.assignComision(id, dto, req.user!);
  }
}

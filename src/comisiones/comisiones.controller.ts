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
  UseGuards,
} from '@nestjs/common';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { ComisionesService } from './comisiones.service';
import { ComisionesQueryDto } from './dto/comisiones-query.dto';
import { CreateComisionDto } from './dto/create-comision.dto';
import { UpdateComisionParticipantesDto } from './dto/update-comision-participantes.dto';
import { UpdateComisionDto } from './dto/update-comision.dto';

const ADULT_ROLES = [
  'AYUDANTE',
  'JEFATURA',
  'SECRETARIA_TESORERIA',
  'JEFATURA_RAMA',
  'AYUDANTE_RAMA',
  'INTENDENCIA',
] as const;

@Controller('comisiones')
export class ComisionesController {
  constructor(private readonly comisionesService: ComisionesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:COMISION')
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: ComisionesQueryDto,
  ) {
    return this.comisionesService.findAll(req.user!, query);
  }

  @Get('options')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:COMISION')
  async getOptions() {
    return this.comisionesService.getOptions();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:COMISION')
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.comisionesService.findOne(id, req.user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('CREATE:COMISION')
  @Roles(...ADULT_ROLES)
  async create(@Body() dto: CreateComisionDto) {
    return this.comisionesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:COMISION')
  @Roles(...ADULT_ROLES)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComisionDto,
  ) {
    return this.comisionesService.update(id, dto);
  }

  @Get(':id/participantes')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:COMISION')
  async getParticipantes(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.comisionesService.getParticipantes(id, req.user);
  }

  @Patch(':id/participantes')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:COMISION')
  @Roles(...ADULT_ROLES)
  async updateParticipantes(
    @Request() _req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComisionParticipantesDto,
  ) {
    return this.comisionesService.updateParticipantes(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('DELETE:COMISION')
  @Roles(...ADULT_ROLES)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.comisionesService.remove(id);
  }
}

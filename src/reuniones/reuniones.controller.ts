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
import { CreateReunionDto } from './dto/create-reunion.dto';
import { ReunionesQueryDto } from './dto/reuniones-query.dto';
import { UpdateReunionInvitadosDto } from './dto/update-reunion-invitados.dto';
import { UpdateReunionDto } from './dto/update-reunion.dto';
import { ReunionesService } from './reuniones.service';

const ADULT_ROLES = [
  'ADM',
  'DEV',
  'OWN',
  'AYUDANTE',
  'JEFATURA',
  'SECRETARIA_TESORERIA',
  'JEFATURA_RAMA',
  'AYUDANTE_RAMA',
  'INTENDENCIA',
] as const;

@Controller('reuniones')
export class ReunionesController {
  constructor(private readonly reunionesService: ReunionesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:REUNION')
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: ReunionesQueryDto,
  ) {
    return this.reunionesService.findAll(req.user!, query);
  }

  @Get('options')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:REUNION')
  async getOptions(@Request() req: AuthenticatedRequest) {
    return this.reunionesService.getOptions(req.user!);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:REUNION')
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reunionesService.findOne(id, req.user!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('CREATE:REUNION')
  @Roles(...ADULT_ROLES)
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateReunionDto,
  ) {
    return this.reunionesService.create(dto, req.user!);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:REUNION')
  @Roles(...ADULT_ROLES)
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReunionDto,
  ) {
    return this.reunionesService.update(id, dto, req.user!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('DELETE:REUNION')
  @Roles(...ADULT_ROLES)
  async remove(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.reunionesService.remove(id, req.user!);
  }

  @Get(':id/invitados')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:REUNION')
  async getInvitados(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reunionesService.getInvitados(id, req.user!);
  }

  @Patch(':id/invitados')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:INVITADO_REUNION')
  @Roles(...ADULT_ROLES)
  async updateInvitados(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReunionInvitadosDto,
  ) {
    return this.reunionesService.updateInvitados(id, dto, req.user!);
  }
}

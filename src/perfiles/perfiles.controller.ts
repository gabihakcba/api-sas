import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { UpdatePerfilFirmaDto } from './dto/update-perfil-firma.dto';
import { PerfilesService } from './perfiles.service';

@Controller('perfiles')
@UseGuards(JwtAuthGuard)
export class PerfilesController {
  constructor(private readonly perfilesService: PerfilesService) {}

  @Get('me')
  async findMe(@Request() req: AuthenticatedRequest) {
    return this.perfilesService.findMe(req.user!);
  }

  @Get('me/asignacion')
  async getMyAsignacion(@Request() req: AuthenticatedRequest) {
    const perfil = await this.perfilesService.findMe(req.user!);
    return this.perfilesService.getAsignacion(perfil.id, req.user!);
  }

  @Get('me/actividad')
  async getMyActividad(@Request() req: AuthenticatedRequest) {
    const perfil = await this.perfilesService.findMe(req.user!);
    return this.perfilesService.getActividad(perfil.id, req.user!);
  }

  @Get('me/vinculos')
  async getMyVinculos(@Request() req: AuthenticatedRequest) {
    const perfil = await this.perfilesService.findMe(req.user!);
    return this.perfilesService.getVinculos(perfil.id, req.user!);
  }

  @Get('me/firma')
  async getMyFirma(@Request() req: AuthenticatedRequest) {
    const perfil = await this.perfilesService.findMe(req.user!);
    return this.perfilesService.getFirma(perfil.id, req.user!);
  }

  @Patch('me/firma')
  async updateMyFirma(
    @Body() dto: UpdatePerfilFirmaDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const perfil = await this.perfilesService.findMe(req.user!);
    return this.perfilesService.updateFirma(perfil.id, dto, req.user!);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.perfilesService.findOne(id, req.user!);
  }

  @Get(':id/asignacion')
  async getAsignacion(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.perfilesService.getAsignacion(id, req.user!);
  }

  @Get(':id/actividad')
  async getActividad(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.perfilesService.getActividad(id, req.user!);
  }

  @Get(':id/vinculos')
  async getVinculos(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.perfilesService.getVinculos(id, req.user!);
  }

  @Get(':id/firma')
  async getFirma(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.perfilesService.getFirma(id, req.user!);
  }

  @Patch(':id/firma')
  async updateFirma(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePerfilFirmaDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.perfilesService.updateFirma(id, dto, req.user!);
  }
}

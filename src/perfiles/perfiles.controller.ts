import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
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
}

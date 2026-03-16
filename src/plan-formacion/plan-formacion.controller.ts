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
  Request,
  UseGuards,
} from '@nestjs/common';
import { CreateAdjuntoFormacionDto } from './dto/create-adjunto-formacion.dto';
import { CreateAsignacionApfDto } from './dto/create-asignacion-apf.dto';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { CreatePlanDesempenoDto } from './dto/create-plan-desempeno.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdatePlanDesempenoCompetenciaDto } from './dto/update-plan-desempeno-competencia.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { PlanFormacionService } from './plan-formacion.service';

@Controller('plan-formacion')
export class PlanFormacionController {
  constructor(private readonly planFormacionService: PlanFormacionService) {}

  @Get('templates')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:PLAN_FORMACION')
  async getTemplates() {
    return this.planFormacionService.getTemplates();
  }

  @Get('templates/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:PLAN_FORMACION')
  async getTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.planFormacionService.getTemplate(id);
  }

  @Get('options')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:PLAN_FORMACION', 'CREATE:PLAN_DESEMPENO')
  async getOptions(@Request() req: AuthenticatedRequest) {
    return this.planFormacionService.getOptions(req.user!);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:PLAN_FORMACION')
  async getAdminWorkspace(@Request() req: AuthenticatedRequest) {
    return this.planFormacionService.getAdminWorkspace(req.user!);
  }

  @Get('desempeno/me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:PLAN_DESEMPENO')
  async getMyPlanDesempeno(@Request() req: AuthenticatedRequest) {
    return this.planFormacionService.getMyPlanDesempeno(req.user!);
  }

  @Get('desempeno/miembro/:memberId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:PLAN_DESEMPENO')
  async getPlanDesempenoByMember(
    @Param('memberId', ParseIntPipe) memberId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.planFormacionService.getPlanDesempenoByMember(
      memberId,
      req.user!,
    );
  }

  @Post('desempeno')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('CREATE:PLAN_DESEMPENO')
  async createPlanDesempeno(
    @Body() dto: CreatePlanDesempenoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.planFormacionService.createPlanDesempeno(req.user!, dto);
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('CREATE:PLAN_FORMACION')
  async createTemplate(
    @Body() dto: CreateTemplateDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.planFormacionService.createTemplate(req.user!, dto);
  }

  @Post('templates/default')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('CREATE:PLAN_FORMACION')
  async createTemplateDefault(
    @Body('nombre') nombre: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.planFormacionService.createTemplateWithDefaults(
      req.user!,
      nombre,
    );
  }

  @Patch('templates/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:PLAN_FORMACION')
  async updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTemplateDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.planFormacionService.updateTemplate(req.user!, id, dto);
  }

  @Post('templates/:id/adjuntos')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:PLAN_FORMACION', 'CREATE:ADJUNTO_FORMACION')
  async uploadAdjunto(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAdjuntoFormacionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.planFormacionService.uploadAdjunto(req.user!, id, dto);
  }

  @Get('adjuntos/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:PLAN_FORMACION')
  async downloadAdjunto(@Param('id', ParseIntPipe) id: number) {
    return this.planFormacionService.downloadAdjunto(id);
  }

  @Delete('adjuntos/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:PLAN_FORMACION', 'DELETE:ADJUNTO_FORMACION')
  async removeAdjunto(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.planFormacionService.removeAdjunto(req.user!, id);
  }

  @Post('apf')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:PLAN_FORMACION')
  async createAsignacionApf(
    @Body() dto: CreateAsignacionApfDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.planFormacionService.createAsignacionApf(req.user!, dto);
  }

  @Delete('apf/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:PLAN_FORMACION')
  async closeAsignacionApf(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.planFormacionService.closeAsignacionApf(req.user!, id);
  }

  @Patch('desempeno/:planId/competencias/:competenciaTemplateId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:PLAN_DESEMPENO')
  async updatePlanCompetencia(
    @Param('planId', ParseIntPipe) planId: number,
    @Param('competenciaTemplateId', ParseIntPipe) competenciaTemplateId: number,
    @Body() dto: UpdatePlanDesempenoCompetenciaDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.planFormacionService.updatePlanCompetencia(
      req.user!,
      planId,
      competenciaTemplateId,
      dto,
    );
  }
}

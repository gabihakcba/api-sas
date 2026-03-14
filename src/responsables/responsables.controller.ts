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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { CreateResponsableDto } from './dto/create-responsable.dto';
import { ResponsablesQueryDto } from './dto/responsables-query.dto';
import { UpdateResponsabilidadesDto } from './dto/update-responsabilidades.dto';
import { UpdateResponsableDto } from './dto/update-responsable.dto';
import { ResponsablesService } from './responsables.service';

@Controller('responsables')
export class ResponsablesController {
  constructor(private readonly responsablesService: ResponsablesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:MIEMBRO', 'READ:RESPONSABLE')
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: ResponsablesQueryDto,
  ) {
    return this.responsablesService.findAll(req.user!, query);
  }

  @Get('options')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:MIEMBRO', 'READ:RESPONSABLE')
  async getOptions(@Request() req: AuthenticatedRequest) {
    return this.responsablesService.getOptions(req.user!);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:MIEMBRO', 'READ:RESPONSABLE')
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.responsablesService.findOne(id, req.user!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('CREATE:MIEMBRO', 'CREATE:RESPONSABLE')
  async create(
    @Body() dto: CreateResponsableDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.responsablesService.create(dto, req.user!);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:MIEMBRO', 'UPDATE:RESPONSABLE')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateResponsableDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.responsablesService.update(id, dto, req.user!);
  }

  @Patch(':id/responsabilidades')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:RESPONSABLE', 'UPDATE:PROTAGONISTA')
  async updateResponsabilidades(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateResponsabilidadesDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.responsablesService.updateResponsabilidades(id, dto, req.user!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('DELETE:MIEMBRO', 'DELETE:RESPONSABLE')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.responsablesService.remove(id, req.user!);
  }
}

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
  Query,
  Request,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SCOPE } from '@prisma/client';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { ScopeAccess } from '../auth/decorators/scopes.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ScopesGuard } from '../auth/guards/scopes.guard';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { CreateProtagonistaDto } from './dto/create-protagonista.dto';
import { ProtagonistaPaseDto } from './dto/protagonista-pase.dto';
import { ProtagonistasService } from './protagonistas.service';
import { UpdateProtagonistaDto } from './dto/update-protagonista.dto';
import { ProtagonistasQueryDto } from './dto/protagonistas-query.dto';

@Controller('protagonistas')
export class ProtagonistasController {
  constructor(private readonly protagonistasService: ProtagonistasService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:MIEMBRO', 'READ:PROTAGONISTA')
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: ProtagonistasQueryDto,
  ) {
    return this.protagonistasService.findAll(req.user!, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:MIEMBRO', 'READ:PROTAGONISTA')
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.protagonistasService.findOne(id, req.user!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard, ScopesGuard)
  @CheckPermissions('CREATE:MIEMBRO', 'CREATE:PROTAGONISTA')
  @ScopeAccess(
    { scopeType: SCOPE.RAMA, entity: 'RAMA', field: 'idRama' },
    { scopeType: SCOPE.AREA, entity: 'RAMA', field: 'idRama' },
  )
  async create(@Body() dto: CreateProtagonistaDto) {
    return this.protagonistasService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, ScopesGuard)
  @CheckPermissions('UPDATE:MIEMBRO', 'UPDATE:PROTAGONISTA')
  @ScopeAccess(
    { scopeType: SCOPE.RAMA, entity: 'RAMA', field: 'idRama', optional: true },
    { scopeType: SCOPE.AREA, entity: 'RAMA', field: 'idRama', optional: true },
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProtagonistaDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.protagonistasService.update(id, dto, req.user!);
  }

  @Post(':id/pase')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard, ScopesGuard)
  @CheckPermissions('UPDATE:MIEMBRO', 'UPDATE:PROTAGONISTA')
  @ScopeAccess(
    { scopeType: SCOPE.RAMA, entity: 'RAMA', field: 'idRama' },
    { scopeType: SCOPE.AREA, entity: 'RAMA', field: 'idRama' },
  )
  async registerPase(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProtagonistaPaseDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.protagonistasService.registerPase(id, dto, req.user!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('DELETE:MIEMBRO', 'DELETE:PROTAGONISTA')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.protagonistasService.remove(id, req.user!);
  }
}

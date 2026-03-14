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
import { SCOPE } from '@prisma/client';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { ScopeAccess } from '../auth/decorators/scopes.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ScopesGuard } from '../auth/guards/scopes.guard';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { AdultosService } from './adultos.service';
import { AdultosQueryDto } from './dto/adultos-query.dto';
import { CreateAdultoDto } from './dto/create-adulto.dto';
import { UpdateAdultoFirmaDto } from './dto/update-adulto-firma.dto';
import { UpdateAdultoDto } from './dto/update-adulto.dto';

@Controller('adultos')
export class AdultosController {
  constructor(private readonly adultosService: AdultosService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:MIEMBRO', 'READ:ADULTO')
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: AdultosQueryDto,
  ) {
    return this.adultosService.findAll(req.user!, query);
  }

  @Get('options')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:MIEMBRO', 'READ:ADULTO')
  async getOptions(@Request() req: AuthenticatedRequest) {
    return this.adultosService.getOptions(req.user!);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:MIEMBRO', 'READ:ADULTO')
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adultosService.findOne(id, req.user!);
  }

  @Get(':id/firma')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:MIEMBRO', 'READ:ADULTO')
  async getFirma(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adultosService.getFirma(id, req.user!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard, ScopesGuard)
  @CheckPermissions('CREATE:MIEMBRO', 'CREATE:ADULTO')
  @ScopeAccess(
    { scopeType: SCOPE.AREA, entity: 'AREA', field: 'idArea' },
    { scopeType: SCOPE.RAMA, entity: 'RAMA', field: 'idRama', optional: true },
  )
  async create(@Body() dto: CreateAdultoDto) {
    return this.adultosService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, ScopesGuard)
  @CheckPermissions('UPDATE:MIEMBRO', 'UPDATE:ADULTO')
  @ScopeAccess(
    { scopeType: SCOPE.AREA, entity: 'AREA', field: 'idArea', optional: true },
    { scopeType: SCOPE.RAMA, entity: 'RAMA', field: 'idRama', optional: true },
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdultoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adultosService.update(id, dto, req.user!);
  }

  @Patch(':id/firma')
  @UseGuards(JwtAuthGuard)
  async updateFirma(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdultoFirmaDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adultosService.updateFirma(id, dto, req.user!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('DELETE:MIEMBRO', 'DELETE:ADULTO')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.adultosService.remove(id, req.user!);
  }
}

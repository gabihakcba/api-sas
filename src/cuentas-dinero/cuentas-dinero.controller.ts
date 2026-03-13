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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CuentasDineroService } from './cuentas-dinero.service';
import { CreateCuentaDineroDto } from './dto/create-cuenta-dinero.dto';
import { UpdateCuentaDineroDto } from './dto/update-cuenta-dinero.dto';

@Controller('cuentas-dinero')
export class CuentasDineroController {
  constructor(private readonly cuentasDineroService: CuentasDineroService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CUENTA_DINERO')
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.cuentasDineroService.findAll(req.user!, paginationQuery);
  }

  @Get('options')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CUENTA_DINERO')
  async getOptions(@Request() req: AuthenticatedRequest) {
    return this.cuentasDineroService.getOptions(req.user!);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CUENTA_DINERO')
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cuentasDineroService.findOne(id, req.user!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard, ScopesGuard)
  @CheckPermissions('CREATE:CUENTA_DINERO')
  @ScopeAccess(
    { scopeType: SCOPE.AREA, entity: 'AREA', field: 'idArea', optional: true },
    { scopeType: SCOPE.RAMA, entity: 'RAMA', field: 'idRama', optional: true },
  )
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateCuentaDineroDto,
  ) {
    return this.cuentasDineroService.create(dto, req.user!);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, ScopesGuard)
  @CheckPermissions('UPDATE:CUENTA_DINERO')
  @ScopeAccess(
    { scopeType: SCOPE.AREA, entity: 'AREA', field: 'idArea', optional: true },
    { scopeType: SCOPE.RAMA, entity: 'RAMA', field: 'idRama', optional: true },
  )
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCuentaDineroDto,
  ) {
    return this.cuentasDineroService.update(id, dto, req.user!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('DELETE:CUENTA_DINERO')
  async remove(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.cuentasDineroService.remove(id, req.user!);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { SCOPE } from '@prisma/client';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { ScopeAccess } from '../auth/decorators/scopes.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ScopesGuard } from '../auth/guards/scopes.guard';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { CuentasDineroService } from './cuentas-dinero.service';
import { CuentasDineroQueryDto } from './dto/cuentas-dinero-query.dto';
import { CreateCuentaDineroDto } from './dto/create-cuenta-dinero.dto';
import { CreateMovimientoCuentaAdjuntosDto } from './dto/create-movimiento-cuenta-adjuntos.dto';
import { CreateMovimientoCuentaDto } from './dto/create-movimiento-cuenta.dto';
import { MovimientosCuentaQueryDto } from './dto/movimientos-cuenta-query.dto';

@Controller('cuentas-dinero')
export class CuentasDineroController {
  constructor(private readonly cuentasDineroService: CuentasDineroService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CUENTA_DINERO')
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: CuentasDineroQueryDto,
  ) {
    return this.cuentasDineroService.findAll(req.user!, query);
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

  @Get(':id/movimientos')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CUENTA_DINERO')
  async findMovimientos(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: MovimientosCuentaQueryDto,
  ) {
    return this.cuentasDineroService.findMovimientos(id, req.user!, query);
  }

  @Get(':id/movimientos/options')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CUENTA_DINERO')
  async getMovimientosOptions(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cuentasDineroService.getMovimientosOptions(id, req.user!);
  }

  @Get(':id/movimientos/:idMovimiento/adjuntos/:idAdjunto')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CUENTA_DINERO')
  async getMovimientoAdjunto(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('idMovimiento', ParseIntPipe) idMovimiento: number,
    @Param('idAdjunto', ParseIntPipe) idAdjunto: number,
    @Res() res: Response,
  ) {
    const adjunto = await this.cuentasDineroService.getMovimientoAdjunto(
      id,
      idMovimiento,
      idAdjunto,
      req.user!,
    );

    res.setHeader('Content-Type', adjunto.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${adjunto.filename}"`,
    );

    res.send(adjunto.buffer);
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

  @Post(':id/movimientos')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('CREATE:CUENTA_DINERO')
  async createMovimiento(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMovimientoCuentaDto,
  ) {
    return this.cuentasDineroService.createMovimiento(
      id,
      dto,
      req.user!,
      req.audit?.logId,
    );
  }

  @Post(':id/movimientos/:idMovimiento/adjuntos')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('CREATE:CUENTA_DINERO')
  async addMovimientoAdjuntos(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('idMovimiento', ParseIntPipe) idMovimiento: number,
    @Body() dto: CreateMovimientoCuentaAdjuntosDto,
  ) {
    return this.cuentasDineroService.addMovimientoAdjuntos(
      id,
      idMovimiento,
      dto,
      req.user!,
      req.audit?.logId,
    );
  }

  @Delete(':id/movimientos/:idMovimiento/adjuntos/:idAdjunto')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('DELETE:CUENTA_DINERO')
  async removeMovimientoAdjunto(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('idMovimiento', ParseIntPipe) idMovimiento: number,
    @Param('idAdjunto', ParseIntPipe) idAdjunto: number,
  ) {
    await this.cuentasDineroService.removeMovimientoAdjunto(
      id,
      idMovimiento,
      idAdjunto,
      req.user!,
      req.audit?.logId,
    );
  }

  @Delete(':id/movimientos/:idMovimiento')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('DELETE:CUENTA_DINERO')
  async removeMovimiento(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('idMovimiento', ParseIntPipe) idMovimiento: number,
  ) {
    await this.cuentasDineroService.removeMovimiento(
      id,
      idMovimiento,
      req.user!,
      req.audit?.logId,
    );
  }
}

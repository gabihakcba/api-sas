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
  Res,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { CreateEventoVentaDto } from './dto/create-evento-venta.dto';
import { CreateEventoVentaItemDto } from './dto/create-evento-venta-item.dto';
import { CreateEventoVentaReservaDto } from './dto/create-evento-venta-reserva.dto';
import { EventoVentaCostoItemDto } from './dto/evento-venta-costo-item.dto';
import { EventosVentaQueryDto } from './dto/eventos-venta-query.dto';
import { UpdateEventoVentaDto } from './dto/update-evento-venta.dto';
import { UpdateEventoVentaItemDto } from './dto/update-evento-venta-item.dto';
import { UpdateEventoVentaReservaDto } from './dto/update-evento-venta-reserva.dto';
import { EventosVentaService } from './eventos-venta.service';

const ADULT_ROLES = [
  'ADM',
  'AYUDANTE',
  'DEV',
  'JEFATURA',
  'SECRETARIA_TESORERIA',
  'JEFATURA_RAMA',
  'AYUDANTE_RAMA',
  'INTENDENCIA',
] as const;

@Controller('eventos-venta')
export class EventosVentaController {
  constructor(private readonly eventosVentaService: EventosVentaService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('READ:EVENTO')
  @Roles(...ADULT_ROLES)
  async findAll(@Query() query: EventosVentaQueryDto) {
    return this.eventosVentaService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('READ:EVENTO')
  @Roles(...ADULT_ROLES)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventosVentaService.findOne(id);
  }

  @Get(':id/export')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('READ:EVENTO')
  @Roles(...ADULT_ROLES)
  async exportSpreadsheet(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { buffer, fileName } = await this.eventosVentaService.exportSpreadsheet(id);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('CREATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async create(
    @Body() dto: CreateEventoVentaDto,
  ) {
    return this.eventosVentaService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventoVentaDto,
  ) {
    return this.eventosVentaService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('DELETE:EVENTO')
  @Roles(...ADULT_ROLES)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.eventosVentaService.remove(id);
  }

  @Post(':id/items')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async createItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateEventoVentaItemDto,
  ) {
    return this.eventosVentaService.createItem(id, dto);
  }

  @Patch(':id/items/:itemId')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateEventoVentaItemDto,
  ) {
    return this.eventosVentaService.updateItem(id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    await this.eventosVentaService.removeItem(id, itemId);
  }

  @Post(':id/costos')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async createCostoItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EventoVentaCostoItemDto,
  ) {
    return this.eventosVentaService.createCostoItem(id, dto);
  }

  @Patch(':id/costos/:costoItemId')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async updateCostoItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('costoItemId', ParseIntPipe) costoItemId: number,
    @Body() dto: EventoVentaCostoItemDto,
  ) {
    return this.eventosVentaService.updateCostoItem(id, costoItemId, dto);
  }

  @Delete(':id/costos/:costoItemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async removeCostoItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('costoItemId', ParseIntPipe) costoItemId: number,
  ) {
    await this.eventosVentaService.removeCostoItem(id, costoItemId);
  }

  @Post(':id/import')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:EVENTO')
  @Roles(...ADULT_ROLES)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 20 * 1024 * 1024,
      },
    }),
  )
  async importSpreadsheet(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile()
    file: {
      originalname: string;
      mimetype: string;
      buffer: Buffer;
      size: number;
    },
  ) {
    return this.eventosVentaService.importSpreadsheet(id, file);
  }

  @Post(':id/reservas')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async createReserva(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateEventoVentaReservaDto,
  ) {
    return this.eventosVentaService.createReserva(id, dto);
  }

  @Patch(':id/reservas/:reservaId')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async updateReserva(
    @Param('id', ParseIntPipe) id: number,
    @Param('reservaId', ParseIntPipe) reservaId: number,
    @Body() dto: UpdateEventoVentaReservaDto,
  ) {
    return this.eventosVentaService.updateReserva(id, reservaId, dto);
  }

  @Delete(':id/reservas/:reservaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:EVENTO')
  @Roles(...ADULT_ROLES)
  async removeReserva(
    @Param('id', ParseIntPipe) id: number,
    @Param('reservaId', ParseIntPipe) reservaId: number,
  ) {
    await this.eventosVentaService.removeReserva(id, reservaId);
  }
}

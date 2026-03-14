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
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { CreatePagoDto } from './dto/create-pago.dto';
import { PagosQueryDto } from './dto/pagos-query.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { PagosService } from './pagos.service';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:PAGO')
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: PagosQueryDto,
  ) {
    return this.pagosService.findAll(req.user!, query);
  }

  @Get('options')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:PAGO')
  async getOptions(@Request() req: AuthenticatedRequest) {
    return this.pagosService.getOptions(req.user!);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:PAGO')
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.pagosService.findOne(id, req.user!);
  }

  @Get(':id/comprobante')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:PAGO')
  async exportReceiptPdf(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const receipt = await this.pagosService.exportReceiptPdf(id, req.user!);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${receipt.filename}"`,
    );

    res.send(receipt.buffer);
  }

  @Get(':id/comprobante-pago')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:PAGO')
  async getAttachedReceipt(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const receipt = await this.pagosService.getAttachedReceipt(id, req.user!);

    res.setHeader('Content-Type', receipt.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${receipt.filename}"`,
    );

    res.send(receipt.buffer);
  }

  @Get(':id/whatsapp')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:PAGO')
  async getWhatsappShareData(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.pagosService.getWhatsappShareData(id, req.user!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('CREATE:PAGO')
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreatePagoDto,
  ) {
    return this.pagosService.create(dto, req.user!);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:PAGO')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePagoDto,
  ) {
    return this.pagosService.update(id, dto, req.user!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('DELETE:PAGO')
  async remove(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.pagosService.remove(id, req.user!);
  }
}

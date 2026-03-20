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
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ACTION, RESOURCE } from '@prisma/client';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { CreateSabatinoDto } from './dto/create-sabatino.dto';
import { SabatinosQueryDto } from './dto/sabatinos-query.dto';
import { UpdateSabatinoActividadesDto } from './dto/update-sabatino-actividades.dto';
import { UpdateSabatinoDto } from './dto/update-sabatino.dto';
import { SabatinosService } from './sabatinos.service';

@Controller('sabatinos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SabatinosController {
  constructor(private readonly sabatinosService: SabatinosService) {}

  @Get()
  @CheckPermissions(`${ACTION.READ}:${RESOURCE.SABATINO}`)
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: SabatinosQueryDto,
  ) {
    return this.sabatinosService.findAll(req.user!, query);
  }

  @Get('options')
  @CheckPermissions(`${ACTION.READ}:${RESOURCE.SABATINO}`)
  async getOptions(@Request() req: AuthenticatedRequest) {
    return this.sabatinosService.getOptions(req.user!);
  }

  @Get(':id')
  @CheckPermissions(`${ACTION.READ}:${RESOURCE.SABATINO}`)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.sabatinosService.findOne(id, req.user!);
  }

  @Post()
  @CheckPermissions(`${ACTION.CREATE}:${RESOURCE.SABATINO}`)
  async create(@Body() dto: CreateSabatinoDto) {
    return this.sabatinosService.create(dto);
  }

  @Patch(':id')
  @CheckPermissions(`${ACTION.UPDATE}:${RESOURCE.SABATINO}`)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSabatinoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.sabatinosService.update(id, dto, req.user!);
  }

  @Patch(':id/actividades')
  @CheckPermissions(`${ACTION.UPDATE}:${RESOURCE.SABATINO}`)
  async updateActividades(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSabatinoActividadesDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.sabatinosService.updateActividades(id, dto, req.user!);
  }

  @Get(':id/export')
  @CheckPermissions(`${ACTION.READ}:${RESOURCE.SABATINO}`)
  async exportPdf(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const buffer = await this.sabatinosService.exportPdf(id, req.user!);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=sabatino-${id}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckPermissions(`${ACTION.DELETE}:${RESOURCE.SABATINO}`)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.sabatinosService.remove(id, req.user!);
  }
}

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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ConsejosService } from './consejos.service';
import { CreateConsejoDto } from './dto/create-consejo.dto';
import { UpdateConsejoDto } from './dto/update-consejo.dto';
import { CreateTemarioConsejoDto } from './dto/create-temario-consejo.dto';
import { UpdateTemarioConsejoDto } from './dto/update-temario-consejo.dto';
import { ConsejoAsistenciaOptionsQueryDto } from './dto/consejo-asistencia-options-query.dto';
import { CreateAsistenciaConsejoDto } from './dto/create-asistencia-consejo.dto';

@Controller('consejos')
export class ConsejosController {
  constructor(private readonly consejosService: ConsejosService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CONSEJO')
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.consejosService.findAll(req.user!, paginationQuery);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CONSEJO')
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.consejosService.findOne(id, req.user!);
  }

  @Get(':id/temario')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CONSEJO')
  async findTemario(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.consejosService.findTemario(id, req.user!);
  }

  @Get(':id/asistencias')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CONSEJO')
  async findAsistencias(@Param('id', ParseIntPipe) id: number) {
    return this.consejosService.findAsistencias(id);
  }

  @Get(':id/asistencias/options')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CONSEJO')
  async getAsistenciaOptions(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ConsejoAsistenciaOptionsQueryDto,
  ) {
    return this.consejosService.getAsistenciaOptions(id, query);
  }

  @Get(':id/export/pdf')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CONSEJO')
  async exportPdf(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const file = await this.consejosService.exportPdf(id, req.user!, true);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    res.send(file.buffer);
  }

  @Get(':id/export/pdf-publico')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CONSEJO')
  async exportPdfPublic(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const file = await this.consejosService.exportPdf(id, req.user!, false);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    res.send(file.buffer);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('CREATE:CONSEJO')
  async create(@Body() dto: CreateConsejoDto) {
    return this.consejosService.create(dto);
  }

  @Post(':id/temario')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:CONSEJO')
  async createTemario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTemarioConsejoDto,
  ) {
    return this.consejosService.createTemario(id, dto);
  }

  @Post(':id/asistencias')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:CONSEJO')
  async createAsistencia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAsistenciaConsejoDto,
  ) {
    return this.consejosService.createAsistencia(id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:CONSEJO')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateConsejoDto,
  ) {
    return this.consejosService.update(id, dto);
  }

  @Patch(':id/temario/:temarioId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:CONSEJO')
  async updateTemario(
    @Param('id', ParseIntPipe) id: number,
    @Param('temarioId', ParseIntPipe) temarioId: number,
    @Body() dto: UpdateTemarioConsejoDto,
  ) {
    return this.consejosService.updateTemario(id, temarioId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('DELETE:CONSEJO')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.consejosService.remove(id);
  }

  @Delete(':id/temario/:temarioId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:CONSEJO')
  async removeTemario(
    @Param('id', ParseIntPipe) id: number,
    @Param('temarioId', ParseIntPipe) temarioId: number,
  ) {
    await this.consejosService.removeTemario(id, temarioId);
  }
}

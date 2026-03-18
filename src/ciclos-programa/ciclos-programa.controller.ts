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
import { CiclosProgramaService } from './ciclos-programa.service';
import { CiclosProgramaQueryDto } from './dto/ciclos-programa-query.dto';
import { CreateCicloProgramaDto } from './dto/create-ciclo-programa.dto';
import { UpdateCicloProgramaDto } from './dto/update-ciclo-programa.dto';

@Controller('ciclos-programa')
export class CiclosProgramaController {
  constructor(private readonly ciclosProgramaService: CiclosProgramaService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CICLO_PROGRAMA')
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: CiclosProgramaQueryDto,
  ) {
    return this.ciclosProgramaService.findAll(req.user!, query);
  }

  @Get('options')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CICLO_PROGRAMA')
  async getOptions(@Request() req: AuthenticatedRequest) {
    return this.ciclosProgramaService.getOptions(req.user!);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CICLO_PROGRAMA')
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ciclosProgramaService.findOne(id, req.user!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('CREATE:CICLO_PROGRAMA')
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateCicloProgramaDto,
  ) {
    return this.ciclosProgramaService.create(req.user!, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:CICLO_PROGRAMA')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCicloProgramaDto,
  ) {
    return this.ciclosProgramaService.update(req.user!, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('DELETE:CICLO_PROGRAMA')
  async remove(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.ciclosProgramaService.remove(req.user!, id);
  }
}

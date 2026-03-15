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
  UseGuards,
} from '@nestjs/common';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ComisionesService } from './comisiones.service';
import { CreateComisionDto } from './dto/create-comision.dto';
import { UpdateComisionDto } from './dto/update-comision.dto';

const ADULT_ROLES = [
  'JEFATURA',
  'SECRETARIA_TESORERIA',
  'JEFATURA_RAMA',
  'AYUDANTE_RAMA',
  'INTENDENCIA',
] as const;

@Controller('comisiones')
export class ComisionesController {
  constructor(private readonly comisionesService: ComisionesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:COMISION')
  async findAll(@Query() query: PaginationQueryDto) {
    return this.comisionesService.findAll(query);
  }

  @Get('options')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:COMISION')
  async getOptions() {
    return this.comisionesService.getOptions();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:COMISION')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.comisionesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('CREATE:COMISION')
  @Roles(...ADULT_ROLES)
  async create(@Body() dto: CreateComisionDto) {
    return this.comisionesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('UPDATE:COMISION')
  @Roles(...ADULT_ROLES)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComisionDto,
  ) {
    return this.comisionesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
  @CheckPermissions('DELETE:COMISION')
  @Roles(...ADULT_ROLES)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.comisionesService.remove(id);
  }
}

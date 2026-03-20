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
import { ACTION, RESOURCE } from '@prisma/client';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { ActividadesQueryDto } from './dto/actividades-query.dto';
import { ActividadesService } from './actividades.service';

@Controller('actividades')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ActividadesController {
  constructor(private readonly actividadesService: ActividadesService) {}

  @Get()
  @CheckPermissions(`${ACTION.READ}:${RESOURCE.ACTIVIDAD}`)
  async findAll(@Query() query: ActividadesQueryDto) {
    return this.actividadesService.findAll(query);
  }

  @Get('tipos')
  @CheckPermissions(`${ACTION.READ}:${RESOURCE.TIPO_ACTIVIDAD}`)
  async getTipos() {
    return this.actividadesService.getTipos();
  }

  @Get(':id')
  @CheckPermissions(`${ACTION.READ}:${RESOURCE.ACTIVIDAD}`)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.actividadesService.findOne(id);
  }

  @Post()
  @CheckPermissions(`${ACTION.CREATE}:${RESOURCE.ACTIVIDAD}`)
  async create(@Body() dto: CreateActividadDto) {
    return this.actividadesService.create(dto);
  }

  @Patch(':id')
  @CheckPermissions(`${ACTION.UPDATE}:${RESOURCE.ACTIVIDAD}`)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActividadDto,
  ) {
    return this.actividadesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckPermissions(`${ACTION.DELETE}:${RESOURCE.ACTIVIDAD}`)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.actividadesService.remove(id);
  }
}

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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateRelacionDto } from './dto/create-relacion.dto';
import { UpdateRelacionDto } from './dto/update-relacion.dto';
import { RelacionesService } from './relaciones.service';

@Controller('relaciones')
export class RelacionesController {
  constructor(private readonly relacionesService: RelacionesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:RELACION')
  async findAll(@Query() query: PaginationQueryDto) {
    return this.relacionesService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:RELACION')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.relacionesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('CREATE:RELACION')
  async create(@Body() dto: CreateRelacionDto) {
    return this.relacionesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:RELACION')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRelacionDto,
  ) {
    return this.relacionesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('DELETE:RELACION')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.relacionesService.remove(id);
  }
}

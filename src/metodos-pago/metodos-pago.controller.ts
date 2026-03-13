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
import { CreateMetodoPagoDto } from './dto/create-metodo-pago.dto';
import { UpdateMetodoPagoDto } from './dto/update-metodo-pago.dto';
import { MetodosPagoService } from './metodos-pago.service';

@Controller('metodos-pago')
export class MetodosPagoController {
  constructor(private readonly metodosPagoService: MetodosPagoService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:METODO_PAGO')
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.metodosPagoService.findAll(paginationQuery);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:METODO_PAGO')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.metodosPagoService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('CREATE:METODO_PAGO')
  async create(@Body() dto: CreateMetodoPagoDto) {
    return this.metodosPagoService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:METODO_PAGO')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMetodoPagoDto,
  ) {
    return this.metodosPagoService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('DELETE:METODO_PAGO')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.metodosPagoService.remove(id);
  }
}

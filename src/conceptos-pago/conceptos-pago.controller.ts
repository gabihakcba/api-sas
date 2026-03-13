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
import { ConceptosPagoService } from './conceptos-pago.service';
import { CreateConceptoPagoDto } from './dto/create-concepto-pago.dto';
import { UpdateConceptoPagoDto } from './dto/update-concepto-pago.dto';

@Controller('conceptos-pago')
export class ConceptosPagoController {
  constructor(private readonly conceptosPagoService: ConceptosPagoService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CONCEPTO_PAGO')
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.conceptosPagoService.findAll(paginationQuery);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:CONCEPTO_PAGO')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.conceptosPagoService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('CREATE:CONCEPTO_PAGO')
  async create(@Body() dto: CreateConceptoPagoDto) {
    return this.conceptosPagoService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('UPDATE:CONCEPTO_PAGO')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateConceptoPagoDto,
  ) {
    return this.conceptosPagoService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('DELETE:CONCEPTO_PAGO')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.conceptosPagoService.remove(id);
  }
}

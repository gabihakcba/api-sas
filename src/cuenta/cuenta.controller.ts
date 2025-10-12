import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CuentaService } from './cuenta.service';
import { CreateCuentaDto } from './dto/create-cuenta.dto';
import { UpdateCuentaDto } from './dto/update-cuenta.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ROLES } from 'src/constans/db/roles';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('cuenta')
@UseGuards(RolesGuard)
export class CuentaController {
  constructor(private readonly cuentaService: CuentaService) {}

  @Roles(ROLES.JEFATURA, ROLES.JEFATURA_RAMA)
  @Post()
  create(@Body() createCuentaDto: CreateCuentaDto) {
    return this.cuentaService.create(createCuentaDto);
  }

  @Roles(ROLES.JEFATURA, ROLES.TESORERIA)
  @Get()
  findAll() {
    return this.cuentaService.findAll();
  }

  @Roles(ROLES.SELF)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cuentaService.findById(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCuentaDto: UpdateCuentaDto) {
    return this.cuentaService.update(+id, updateCuentaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cuentaService.remove(+id);
  }
}

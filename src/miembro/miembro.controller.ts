import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ROLES } from 'src/constans/db/roles';
import { CreateMiembroDto } from './dto/create-miembro.dto';
import { UpdateMiembroDto } from './dto/update-miembro.dto';
import { MiembroService } from './miembro.service';

@Controller('miembros')
@UseGuards(AuthGuard, RolesGuard)
export class MiembroController {
  constructor(private readonly miembroService: MiembroService) {}

  @Roles(ROLES.JEFATURA, ROLES.JEFATURA_RAMA)
  @Post()
  create(@Body() createMiembroDto: CreateMiembroDto): Promise<any> {
    return this.miembroService.create(createMiembroDto);
  }

  @Roles(ROLES.JEFATURA, ROLES.JEFATURA_RAMA)
  @Get()
  findAll(): Promise<any[]> {
    return this.miembroService.findAll();
  }

  @Roles(ROLES.JEFATURA, ROLES.JEFATURA_RAMA)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.miembroService.findOne(id);
  }

  @Roles(ROLES.JEFATURA, ROLES.JEFATURA_RAMA)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMiembroDto: UpdateMiembroDto,
  ): Promise<any> {
    return this.miembroService.update(id, updateMiembroDto);
  }

  @Roles(ROLES.JEFATURA, ROLES.JEFATURA_RAMA)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.miembroService.remove(id);
  }
}

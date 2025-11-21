import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RamaService } from './rama.service';
import { CreateRamaDto } from './dto/create-rama.dto';
import { UpdateRamaDto } from './dto/update-rama.dto';
import { RequirePermission } from 'src/common/decorators/require-permission.decorator';
import { ACTION, RESOURCE } from '@prisma/client';

@Controller('ramas')
export class RamaController {
  constructor(private readonly ramaService: RamaService) { }

  @Post()
  @RequirePermission(ACTION.MANAGE, RESOURCE.RAMA)
  create(@Body() createRamaDto: CreateRamaDto) {
    return this.ramaService.create(createRamaDto);
  }

  @Get()
  @RequirePermission(ACTION.READ, RESOURCE.RAMA)
  findAll() {
    return this.ramaService.findAll();
  }

  @Get(':id')
  @RequirePermission(ACTION.READ, RESOURCE.RAMA)
  findOne(@Param('id') id: string) {
    return this.ramaService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermission(ACTION.MANAGE, RESOURCE.RAMA)
  update(@Param('id') id: string, @Body() updateRamaDto: UpdateRamaDto) {
    return this.ramaService.update(+id, updateRamaDto);
  }

  @Delete(':id')
  @RequirePermission(ACTION.MANAGE, RESOURCE.RAMA)
  remove(@Param('id') id: string) {
    return this.ramaService.remove(+id);
  }
}

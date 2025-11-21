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

@Controller('ramas')
export class RamaController {
  constructor(private readonly ramaService: RamaService) {}

  @Post()
  create(@Body() createRamaDto: CreateRamaDto) {
    return this.ramaService.create(createRamaDto);
  }

  @Get()
  findAll() {
    return this.ramaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ramaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRamaDto: UpdateRamaDto) {
    return this.ramaService.update(+id, updateRamaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ramaService.remove(+id);
  }
}

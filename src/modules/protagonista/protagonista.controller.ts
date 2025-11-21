import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProtagonistaService } from './protagonista.service';
import { CreateProtagonistaDto } from './dto/create-protagonista.dto';
import { UpdateProtagonistaDto } from './dto/update-protagonista.dto';

@Controller('protagonista')
export class ProtagonistaController {
  constructor(private readonly protagonistaService: ProtagonistaService) {}

  @Post()
  create(@Body() createProtagonistaDto: CreateProtagonistaDto) {
    return this.protagonistaService.create(createProtagonistaDto);
  }

  @Get()
  findAll() {
    return this.protagonistaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.protagonistaService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProtagonistaDto: UpdateProtagonistaDto,
  ) {
    return this.protagonistaService.update(+id, updateProtagonistaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.protagonistaService.remove(+id);
  }
}

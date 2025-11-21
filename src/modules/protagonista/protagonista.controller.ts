import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { ProtagonistaService } from './protagonista.service';
import { CreateProtagonistaDto } from './dto/create-protagonista.dto';
import { UpdateProtagonistaDto } from './dto/update-protagonista.dto';
import { ACTION, RESOURCE } from '@prisma/client';
import { RequirePermission } from 'src/common/decorators/require-permission.decorator';

@Controller('protagonista')
export class ProtagonistaController {
  constructor(private readonly protagonistaService: ProtagonistaService) { }

  @Post()
  @RequirePermission(ACTION.CREATE, RESOURCE.PROTAGONISTA)
  create(@Body() createProtagonistaDto: CreateProtagonistaDto) {
    return this.protagonistaService.create(createProtagonistaDto);
  }

  @Get()
  @RequirePermission(ACTION.READ, RESOURCE.PROTAGONISTA)
  findAll(@Req() req: any) {
    const scopeId = req.scopeId;
    return this.protagonistaService.findAll(scopeId);
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

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ROLES } from 'src/constans/db/roles';
import { CreateMiembroDto } from './dto/create-miembro.dto';
import { MiembroService } from './miembro.service';
import { MiembroWithCuenta } from './types/miembro-with-cuenta.type';

@Controller('miembro')
@UseGuards(AuthGuard, RolesGuard)
export class MiembroController {
  constructor(private readonly miembroService: MiembroService) {}

  @Roles(ROLES.JEFATURA, ROLES.JEFATURA_RAMA)
  @Post()
  create(
    @Body() createMiembroDto: CreateMiembroDto,
  ): Promise<MiembroWithCuenta> {
    return this.miembroService.create(createMiembroDto);
  }
}

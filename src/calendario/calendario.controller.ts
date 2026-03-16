import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CalendarioService } from './calendario.service';
import { CalendarRangeQueryDto } from './dto/calendar-range-query.dto';

@Controller('calendario')
export class CalendarioController {
  constructor(private readonly calendarioService: CalendarioService) {}

  @Get('cumpleanios')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:EVENTO')
  async getCumpleanios(@Query() query: CalendarRangeQueryDto) {
    return this.calendarioService.getCumpleanios(query.from, query.to);
  }
}

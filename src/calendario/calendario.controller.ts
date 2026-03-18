import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { CalendarioService } from './calendario.service';
import { CalendarRangeQueryDto } from './dto/calendar-range-query.dto';

@Controller('calendario')
export class CalendarioController {
  constructor(private readonly calendarioService: CalendarioService) {}

  @Get('cumpleanios')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:EVENTO')
  async getCumpleanios(
    @Request() req: AuthenticatedRequest,
    @Query() query: CalendarRangeQueryDto,
  ) {
    return this.calendarioService.getCumpleanios(
      req.user!,
      query.from,
      query.to,
    );
  }
}

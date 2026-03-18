import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { LogsQueryDto } from './dto/logs-query.dto';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('options')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:LOG')
  async getOptions() {
    return this.logsService.getOptions();
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:LOG')
  async findAll(@Query() query: LogsQueryDto) {
    return this.logsService.findAll(query);
  }
}

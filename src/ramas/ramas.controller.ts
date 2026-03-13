import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { RamasService } from './ramas.service';

@Controller('ramas')
export class RamasController {
  constructor(private readonly ramasService: RamasService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('READ:MIEMBRO', 'READ:PROTAGONISTA')
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.ramasService.findAll(req.user!);
  }
}

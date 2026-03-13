import { Injectable } from '@nestjs/common';
import { ScopeFilterService } from '../auth/services/scope-filter.service';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RamasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeFilterService: ScopeFilterService,
  ) {}

  async findAll(user: AuthenticatedUser) {
    return this.prisma.rama.findMany({
      where: this.scopeFilterService.mergeWhere(
        {
          borrado: false,
        },
        this.scopeFilterService.forRamas(user),
      ),
      orderBy: {
        nombre: 'asc',
      },
      select: {
        id: true,
        nombre: true,
        id_area: true,
      },
    });
  }
}

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthenticatedRequest } from '../auth/types/auth-request.types';
import { AuditService } from './audit.service';
import { AUDIT_LOG_METHODS } from './audit.constants';

@Injectable()
export class RequestAuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!AUDIT_LOG_METHODS.has(request.method ?? '')) {
      return next.handle();
    }

    return from(this.attachLogContext(request)).pipe(
      switchMap(() => next.handle()),
    );
  }

  private async attachLogContext(request: AuthenticatedRequest) {
    const user = request.user;

    const log = await this.auditService.createLogEntry({
      cuenta: user
        ? {
            userId: user.userId,
            username: user.username,
            roles: user.roles,
            scopes: user.scopes,
          }
        : null,
      miembro: user
        ? {
            memberId: user.memberId,
          }
        : null,
      endpoint:
        `${request.method} ${request.originalUrl ?? request.url ?? ''}`.trim(),
      ip: request.ip ?? null,
      userAgent:
        typeof request.headers?.['user-agent'] === 'string'
          ? request.headers['user-agent']
          : null,
    });

    request.audit = {
      logId: log.id,
    };
  }
}

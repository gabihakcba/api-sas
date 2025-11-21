import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const { message, details } = this.normalizeException(exception);
    const responseBody = {
      statusCode: status,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    if (!(exception instanceof HttpException)) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(message, stack);
    }

    httpAdapter.reply(
      ctx.getResponse(),
      { data: null, meta: { error: responseBody } },
      status,
    );
  }

  private normalizeException(exception: unknown): {
    message: string;
    details?: unknown;
  } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return { message: response };
      }

      if (
        response &&
        typeof response === 'object' &&
        'message' in response &&
        typeof response.message !== 'undefined'
      ) {
        const normalizedMessage = Array.isArray(response.message)
          ? response.message.join(', ')
          : String(response.message);
        return {
          message: normalizedMessage,
          details: 'details' in response ? response.details : response,
        };
      }

      return { message: exception.message };
    }

    if (exception instanceof Error) {
      return { message: exception.message };
    }

    return { message: 'Unexpected error' };
  }
}

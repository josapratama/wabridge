import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { AppLogger } from "../logger/app.logger";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ method: string; url: string }>();
    const { method, url } = request;
    const start = Date.now();

    this.logger.logStructured("debug", `→ ${method} ${url}`, {}, "HTTP");

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.logStructured(
            "info",
            `← ${method} ${url} [${ms}ms]`,
            { durationMs: ms },
            "HTTP",
          );
        },
        error: (err: unknown) => {
          const ms = Date.now() - start;
          const message = err instanceof Error ? err.message : "Unknown error";
          this.logger.logStructured(
            "error",
            `← ${method} ${url} [${ms}ms] ERROR: ${message}`,
            { durationMs: ms },
            "HTTP",
          );
        },
      }),
    );
  }
}

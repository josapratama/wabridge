import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import type { ApiResponse } from "../types";

/**
 * Wraps all successful controller responses in the standard ApiResponse envelope.
 * Exception filter responses bypass this interceptor entirely (NestJS behavior).
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If already wrapped (e.g., controller returned ApiResponse directly), pass through
        if (this.isApiResponse(data)) {
          return data as unknown as ApiResponse<T>;
        }

        return {
          success: true,
          message: "OK",
          data: data ?? null,
          error: null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  private isApiResponse(data: unknown): boolean {
    return (
      typeof data === "object" &&
      data !== null &&
      "success" in data &&
      "timestamp" in data &&
      "error" in data
    );
  }
}

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { ApiResponse } from "../types";
import { ERROR_CODES } from "../constants";
import { AppLogger } from "../logger/app.logger";

// Supports both Express (res.status().json()) and Fastify (reply.code().send())
type AnyResponse =
  | { status(code: number): { json(body: unknown): void } } // Express
  | { code(code: number): { send(body: unknown): void } }; // Fastify

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Record<string, unknown>>();
    const request = ctx.getRequest<{ method: string; url: string }>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode: string = ERROR_CODES.INTERNAL_ERROR;
    let message = "Internal server error";
    let details: unknown = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === "string") {
        message = responseBody;
        errorCode = this.statusToCode(statusCode);
      } else if (typeof responseBody === "object" && responseBody !== null) {
        const body = responseBody as Record<string, unknown>;
        message = Array.isArray(body["message"])
          ? (body["message"] as string[]).join(", ")
          : ((body["message"] as string) ?? exception.message);
        details = body["message"] ?? null;
        errorCode = (body["error"] as string) ?? this.statusToCode(statusCode);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.logStructured(
      "error",
      `[${request.method}] ${request.url} → ${statusCode}`,
      { errorCode, message },
      "ExceptionFilter",
    );

    const body: ApiResponse = {
      success: false,
      message,
      data: null,
      error: { code: errorCode, details },
      timestamp: new Date().toISOString(),
    };

    // Adapter-agnostic response: try Express first, then Fastify
    if (typeof (response as { status?: unknown })["status"] === "function") {
      // Express adapter
      const expressRes = response as {
        status(code: number): { json(b: unknown): void };
      };
      expressRes.status(statusCode).json(body);
    } else if (typeof (response as { code?: unknown })["code"] === "function") {
      // Fastify adapter
      const fastifyReply = response as {
        code(code: number): { send(b: unknown): void };
      };
      fastifyReply.code(statusCode).send(body);
    }
  }

  private statusToCode(status: number): string {
    if (status === 400) return ERROR_CODES.VALIDATION_ERROR;
    if (status === 404) return ERROR_CODES.NOT_FOUND;
    return ERROR_CODES.INTERNAL_ERROR;
  }
}

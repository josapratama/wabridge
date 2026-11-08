import { Injectable, LoggerService, LogLevel } from "@nestjs/common";

type LogLevelName = "debug" | "info" | "warn" | "error" | "verbose";

const LEVEL_PRIORITY: Record<LogLevelName, number> = {
  debug: 0,
  verbose: 1,
  info: 2,
  warn: 3,
  error: 4,
};

/**
 * AppLogger - structured, minimal logger with secret masking.
 * Outputs JSON lines in production, pretty-printed in development.
 */
@Injectable()
export class AppLogger implements LoggerService {
  private readonly minLevel: number;
  private readonly isPretty: boolean;

  // Patterns to mask in log output
  private static readonly SENSITIVE_KEYS = [
    "accessToken",
    "access_token",
    "authorization",
    "Authorization",
    "webhookSecret",
    "webhook_secret",
    "appSecret",
    "app_secret",
    "verifyToken",
    "verify_token",
    "password",
    "secret",
  ];

  constructor() {
    const rawLevel = (process.env.LOG_LEVEL ?? "info") as LogLevelName;
    this.minLevel = LEVEL_PRIORITY[rawLevel] ?? LEVEL_PRIORITY.info;
    this.isPretty = process.env.NODE_ENV !== "production";
  }

  log(message: string, context?: string): void {
    this.write("info", message, context);
  }

  error(message: string, trace?: string, context?: string): void {
    this.write("error", message, context, { trace });
  }

  warn(message: string, context?: string): void {
    this.write("warn", message, context);
  }

  debug(message: string, context?: string): void {
    this.write("debug", message, context);
  }

  verbose(message: string, context?: string): void {
    this.write("verbose", message, context);
  }

  // Extended method for structured logging with extra fields
  logStructured(
    level: LogLevelName,
    message: string,
    fields: Record<string, unknown> = {},
    context?: string,
  ): void {
    this.write(level, message, context, fields);
  }

  private write(
    level: LogLevelName,
    message: string,
    context?: string,
    extra?: Record<string, unknown>,
  ): void {
    if ((LEVEL_PRIORITY[level] ?? 0) < this.minLevel) return;

    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      context: context ?? "App",
      message,
      ...this.maskSensitive(extra ?? {}),
    };

    if (this.isPretty) {
      const color = this.levelColor(level);
      const ctx = entry.context ? `[${String(entry.context)}]` : "";
      console.log(
        `${color}${String(entry.timestamp)} ${level.toUpperCase()} ${ctx}\x1b[0m ${message}`,
        extra && Object.keys(extra).length ? this.maskSensitive(extra) : "",
      );
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  private maskSensitive(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (AppLogger.SENSITIVE_KEYS.includes(key)) {
        result[key] = "[REDACTED]";
      } else if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        result[key] = this.maskSensitive(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private levelColor(level: LogLevelName): string {
    const colors: Record<LogLevelName, string> = {
      debug: "\x1b[36m", // cyan
      verbose: "\x1b[35m", // magenta
      info: "\x1b[32m", // green
      warn: "\x1b[33m", // yellow
      error: "\x1b[31m", // red
    };
    return colors[level] ?? "\x1b[0m";
  }

  // NestJS LoggerService compatibility
  setLogLevels?(_levels: LogLevel[]): void {
    // controlled via LOG_LEVEL env
  }
}

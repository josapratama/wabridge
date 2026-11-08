import { Injectable } from "@nestjs/common";
import { AppLogger } from "../logger/app.logger";

export interface HttpRequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

export interface HttpResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

/**
 * Lightweight HTTP client wrapper using native fetch (available in Bun).
 * Handles timeout, JSON serialization, and safe logging (no token leakage).
 */
@Injectable()
export class HttpClient {
  private readonly defaultTimeoutMs: number;

  constructor(private readonly logger: AppLogger) {
    this.defaultTimeoutMs = parseInt(
      process.env.DEFAULT_PROVIDER_TIMEOUT_MS ?? "10000",
      10,
    );
  }

  async request<T = unknown>(
    options: HttpRequestOptions,
  ): Promise<HttpResponse<T>> {
    const { method, url, headers = {}, body, timeoutMs } = options;
    const timeout = timeoutMs ?? this.defaultTimeoutMs;

    // Log request without leaking auth tokens
    this.logger.logStructured(
      "debug",
      "HTTP request",
      {
        method,
        url: this.sanitizeUrl(url),
        hasBody: !!body,
      },
      "HttpClient",
    );

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        signal: controller.signal,
      };

      if (body !== undefined) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let data: T;
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        data = (await response.json()) as T;
      } else {
        data = (await response.text()) as unknown as T;
      }

      this.logger.logStructured(
        "debug",
        "HTTP response",
        {
          status: response.status,
          url: this.sanitizeUrl(url),
        },
        "HttpClient",
      );

      return { status: response.status, data, headers: responseHeaders };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(
          `HTTP request timed out after ${timeout}ms: ${this.sanitizeUrl(url)}`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async get<T = unknown>(
    url: string,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ method: "GET", url, headers });
  }

  async post<T = unknown>(
    url: string,
    body: unknown,
    headers?: Record<string, string>,
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ method: "POST", url, body, headers });
  }

  // Remove query params that might contain tokens from logged URLs
  private sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove common sensitive query params
      ["access_token", "token", "key", "secret"].forEach((p) =>
        parsed.searchParams.delete(p),
      );
      return parsed.toString();
    } catch {
      return url;
    }
  }
}

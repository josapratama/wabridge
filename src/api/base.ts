export const BASE =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:3000";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  error: { code: string; details: unknown } | null;
  timestamp: string;
}

export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};

  if (options?.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((v, k) => {
        headers[k] = v;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([k, v]) => {
        headers[k] = v;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (options?.body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  return res.json() as Promise<ApiResponse<T>>;
}

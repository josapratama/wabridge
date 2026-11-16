import { request } from "./base";

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface AuthHubConfigResponse {
  enabled: boolean;
  authhub_url: string;
  client_id: string;
}

export const authApi = {
  login: (body: { email: string; password: string }) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  register: (body: { name: string; email: string; password: string }) =>
    request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  profile: () => request<User>("/auth/profile"),
  getAuthHubConfig: () =>
    request<AuthHubConfigResponse>("/auth/authhub/config"),
  authHubCallback: (code: string) =>
    request<LoginResponse>("/auth/authhub/callback", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
};

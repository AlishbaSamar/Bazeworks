const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string[]>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions {
  accessToken?: string | null;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (Array.isArray(body?.message) ? body.message[0] : body?.message) ??
      "Something went wrong. Please try again.";
    throw new ApiError(res.status, message);
  }

  return body as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "GET" }, options),
  post: <T>(path: string, data?: unknown, options?: RequestOptions) =>
    request<T>(
      path,
      { method: "POST", body: data ? JSON.stringify(data) : undefined },
      options,
    ),
};

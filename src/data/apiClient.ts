export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

/** Fired when the server no longer accepts the session (401) or wants a new password first (403 on sign-in state). */
export const AUTH_LOST_EVENT = 'ticket-auth-lost';

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

interface RequestOptions {
  /** Do not show the error toast; the caller reports the failure itself (sign-in form, background polling). */
  quiet?: boolean;
}

function report(message: string) {
  window.dispatchEvent(new CustomEvent('ticket-api-error', { detail: message }));
}

/** Sends the request with the session cookie and turns error responses into {@link ApiError}. */
export async function apiFetch(path: string, init?: RequestInit, options: RequestOptions = {}): Promise<Response> {
  if (typeof window === 'undefined') throw new Error('Backend chỉ gọi được từ trình duyệt');
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { credentials: 'include', ...init });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể kết nối backend';
    if (!options.quiet) report(message);
    throw new ApiError(0, message);
  }
  if (response.ok) return response;
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  const message = body?.message ?? `Yêu cầu API thất bại (${response.status})`;
  if (response.status === 401 && !path.startsWith('/api/auth/login')) {
    window.dispatchEvent(new CustomEvent(AUTH_LOST_EVENT, { detail: message }));
  } else if (!options.quiet) {
    report(message);
  }
  throw new ApiError(response.status, message);
}

export async function apiRequest<T>(path: string, init?: RequestInit, options?: RequestOptions): Promise<T> {
  const headers = init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers;
  const response = await apiFetch(path, { ...init, headers }, options);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

import { ApiError } from './types.js';

interface ApiEnvelope<T> {
  data: T;
}

export type ErrorClass = 'client' | 'server' | 'network';

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
    public readonly errorClass: ErrorClass = 'server',
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Maps an ApiClientError's errorClass to a user-facing message.
 * Co-located with ApiClientError so both are imported from the same module.
 */
export function classifyError(err: ApiClientError): string {
  switch (err.errorClass) {
    case 'client':
      return 'The request was invalid. Please check your input and try again.';
    case 'server':
      return 'A server error occurred. Please try again later.';
    case 'network':
      return 'Could not connect to the server. Please check your network connection.';
  }
}

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${url}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    });
  } catch {
    throw new ApiClientError('NETWORK_ERROR', 'Network request failed', undefined, 'network');
  }

  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    const body = await res.json().catch(() => ({ error: { code: 'UNKNOWN', message: 'Request failed' } }));
    const err = body.error as ApiError;
    const errorClass: ErrorClass = res.status >= 400 && res.status < 500 ? 'client' : 'server';
    throw new ApiClientError(err.code, err.message, err.details, errorClass);
  }

  if (res.status === 204) return undefined as T;
  const envelope = (await res.json()) as ApiEnvelope<T>;
  return envelope.data;
}

export const apiClient = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: unknown) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body: unknown) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
  patch: <T>(url: string, body: unknown) =>
    request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
};

'use client';

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
};

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://psb-backend.onrender.com';

export function getAuthHeaders(extraHeaders: HeadersInit = {}) {
  const headers = new Headers(extraHeaders);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = localStorage.getItem('accessToken');
  const deviceId = localStorage.getItem('deviceId');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (deviceId) {
    headers.set('x-device-id', deviceId);
  }

  return headers;
}

export function getBaseHeaders(extraHeaders: HeadersInit = {}) {
  const headers = new Headers(extraHeaders);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const deviceId = localStorage.getItem('deviceId');
  if (deviceId && !headers.has('x-device-id')) {
    headers.set('x-device-id', deviceId);
  }

  return headers;
}

export async function apiRequest<T>(
  path: string,
  { auth = true, headers, body, ...options }: ApiRequestOptions = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    cache: options.cache ?? 'no-store',
    headers: auth ? getAuthHeaders(headers) : getBaseHeaders(headers),
    body,
  });

  const text = await response.text();
  const data = text ? safelyParseJson(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Request failed');
  }

  return data as T;
}

function safelyParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

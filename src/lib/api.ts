const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('quiz_token');
}

export function setToken(token: string) {
  localStorage.setItem('quiz_token', token);
}

export function clearToken() {
  localStorage.removeItem('quiz_token');
}

export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit & { body?: any }
): Promise<{ data?: T; error?: string }> {
  try {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    const json = await res.json();
    if (!res.ok) {
      return { error: json.error || `Request failed with status ${res.status}` };
    }
    return { data: json as T };
  } catch (err: any) {
    return { error: err.message || 'Network error' };
  }
}

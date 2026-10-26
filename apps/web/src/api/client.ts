const API_BASE = '/api/v1';

export class ApiError extends Error {
  public statusCode: number;
  public errors?: any[];

  constructor(message: string, statusCode: number, errors?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('edutrack_access_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  let response = await fetch(url, { ...options, headers });

  // Handle 401 token refresh
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const refreshToken = localStorage.getItem('edutrack_refresh_token');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          localStorage.setItem('edutrack_access_token', refreshData.data.accessToken);
          localStorage.setItem('edutrack_refresh_token', refreshData.data.refreshToken);

          // Retry original request
          headers.set('Authorization', `Bearer ${refreshData.data.accessToken}`);
          response = await fetch(url, { ...options, headers });
        } else {
          localStorage.removeItem('edutrack_access_token');
          localStorage.removeItem('edutrack_refresh_token');
          localStorage.removeItem('edutrack_user');
          window.location.href = '/login';
        }
      } catch {
        localStorage.removeItem('edutrack_access_token');
        localStorage.removeItem('edutrack_refresh_token');
        localStorage.removeItem('edutrack_user');
        window.location.href = '/login';
      }
    }
  }

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.message || 'Request failed', response.status, data.errors);
  }

  return data.data;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => apiClient<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    apiClient<T>(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    apiClient<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  patch: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    apiClient<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { method: 'DELETE', ...options })
};

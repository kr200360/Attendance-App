const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

let authToken: string | null = null;

export function setMobileAuthToken(token: string | null) {
  authToken = token;
}

export async function mobileApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data.data;
}

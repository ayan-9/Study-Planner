const API_BASE = '/api';

// ─── Token helpers ──────────────────────────────────────────
export const getToken = () => localStorage.getItem('auth-token');
export const setToken = (token: string) => localStorage.setItem('auth-token', token);
export const removeToken = () => localStorage.removeItem('auth-token');
export const isAuthenticated = () => !!getToken();

// ─── Core fetch wrapper ─────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...headers, ...(options.headers as Record<string, string> || {}) } });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── API methods ────────────────────────────────────────────
export const api = {
  auth: {
    register: (data: { email: string; password: string; name: string }) =>
      request<{ token: string; user: { id: string; email: string; name: string } }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request<{ token: string; user: { id: string; email: string; name: string } }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request<{ id: string; email: string; name: string }>('/auth/me'),
    forgotPassword: (email: string) =>
      request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token: string, newPassword: string) =>
      request<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
  },
  courses: {
    getAll: () => request<any[]>('/courses'),
    create: (course: any) => request<any>('/courses', { method: 'POST', body: JSON.stringify(course) }),
    remove: (id: string) => request<any>(`/courses/${id}`, { method: 'DELETE' }),
    update: (id: string, data: any) => request<any>(`/courses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  tasks: {
    getAll: () => request<any[]>('/tasks'),
    setAll: (tasks: any[]) => request<any>('/tasks', { method: 'PUT', body: JSON.stringify(tasks) }),
    updateStatus: (id: string, data: { status: string }) => request<any>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  profile: {
    get: () => request<any>('/profile'),
    set: (data: any) => request<any>('/profile', { method: 'PUT', body: JSON.stringify(data) }),
  },
  scheduleConfig: {
    get: () => request<any>('/schedule-config'),
    set: (data: any) => request<any>('/schedule-config', { method: 'PUT', body: JSON.stringify(data) }),
  },
  freeTime: {
    get: () => request<any>('/free-time'),
    set: (data: any) => request<any>('/free-time', { method: 'PUT', body: JSON.stringify(data) }),
  },
};

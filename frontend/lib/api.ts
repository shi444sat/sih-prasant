const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getAuthHeader(): Record<string, string> {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('drishti_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = res.statusText;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

// Authentication
export async function loginUser(email: string, password: string) {
  const res = await fetchApi<{ access_token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem('drishti_token', res.access_token);
    localStorage.setItem('drishti_user', JSON.stringify(res.user));
  }
  return res;
}

export function getCurrentUser() {
  if (typeof window !== 'undefined') {
    const uStr = localStorage.getItem('drishti_user');
    if (uStr) {
      try {
        return JSON.parse(uStr);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function logoutUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('drishti_token');
    localStorage.removeItem('drishti_user');
    window.location.href = '/login';
  }
}

// Dashboard
export async function getDashboardSummary(params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString();
  return fetchApi<any>(`/dashboard/summary${q ? `?${q}` : ''}`);
}

// Projects
export async function getProjects(params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString();
  return fetchApi<any[]>(`/projects${q ? `?${q}` : ''}`);
}

export async function getProjectDetail(id: number | string) {
  return fetchApi<any>(`/projects/${id}`);
}

export async function recalculateProjectRisk(id: number | string) {
  return fetchApi<any>(`/projects/${id}/predict`, { method: 'POST' });
}

// Alerts
export async function getAlerts(params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString();
  return fetchApi<any[]>(`/alerts${q ? `?${q}` : ''}`);
}

export async function acknowledgeAlert(id: number, notes?: string) {
  return fetchApi<any>(`/alerts/${id}/acknowledge`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

export async function resolveAlert(id: number, notes?: string) {
  return fetchApi<any>(`/alerts/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

// Analytics & Benchmarking
export async function getAnalyticsOverview(params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString();
  return fetchApi<any>(`/analytics/overview${q ? `?${q}` : ''}`);
}

export async function getBenchmarks(params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString();
  return fetchApi<any>(`/analytics/benchmarks${q ? `?${q}` : ''}`);
}

// Models
export async function getModelEvaluation() {
  return fetchApi<any>('/models/evaluation');
}

export async function trainModels() {
  return fetchApi<any>('/models/train', { method: 'POST' });
}

// Data Import
export async function validateImportFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const token = typeof window !== 'undefined' ? localStorage.getItem('drishti_token') : null;
  const res = await fetch(`${BASE_URL}/data/validate`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Validation failed');
  }
  return res.json();
}

export async function uploadImportFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const token = typeof window !== 'undefined' ? localStorage.getItem('drishti_token') : null;
  const res = await fetch(`${BASE_URL}/data/import`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Import failed');
  }
  return res.json();
}

// Admin
export async function getAdminConfig() {
  return fetchApi<any>('/admin/config');
}

export async function updateAdminConfig(policy: any) {
  return fetchApi<any>('/admin/config', {
    method: 'PUT',
    body: JSON.stringify(policy),
  });
}

export async function getAdminUsers() {
  return fetchApi<any[]>('/admin/users');
}

export async function getAuditLogs() {
  return fetchApi<any[]>('/admin/audit-logs');
}

// Assistant
export async function queryAssistant(query: string) {
  return fetchApi<any>('/assistant/query', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

// Reset Demo Environment
export async function resetDemoEnvironment() {
  return fetchApi<any>('/admin/reset-demo', {
    method: 'POST',
  });
}


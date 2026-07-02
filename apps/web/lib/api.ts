const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("afc_access_token");
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  window.localStorage.setItem("afc_access_token", accessToken);
  window.localStorage.setItem("afc_refresh_token", refreshToken);
  // Non-sensitive marker cookie so the Next.js middleware can redirect
  // logged-out visitors away from /dashboard and /admin before render.
  document.cookie = "afc_has_session=1; path=/; max-age=2592000";
}

export function clearAuthTokens() {
  window.localStorage.removeItem("afc_access_token");
  window.localStorage.removeItem("afc_refresh_token");
  document.cookie = "afc_has_session=; path=/; max-age=0";
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  isFormData?: boolean;
  authenticated?: boolean;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Thin fetch wrapper used by every page/component to talk to the Express API. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, isFormData = false, authenticated = true } = options;

  const headers: Record<string, string> = {};
  if (!isFormData) headers["Content-Type"] = "application/json";

  if (authenticated) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error ?? "Request failed", res.status, data.details);
  }

  return data as T;
}

// Convenience helpers mirroring the API surface (see docs/API_ARCHITECTURE.md)
export const api = {
  auth: {
    register: (body: { fullName: string; email: string; password: string; country?: string }) =>
      apiRequest<{ user: unknown; accessToken: string; refreshToken: string }>("/auth/register", { method: "POST", body, authenticated: false }),
    login: (body: { email: string; password: string }) =>
      apiRequest<{ user: unknown; accessToken: string; refreshToken: string }>("/auth/login", { method: "POST", body, authenticated: false }),
    google: (idToken: string) =>
      apiRequest<{ user: unknown; accessToken: string; refreshToken: string }>("/auth/google", { method: "POST", body: { idToken }, authenticated: false }),
    forgotPassword: (email: string) =>
      apiRequest("/auth/forgot-password", { method: "POST", body: { email }, authenticated: false }),
    resetPassword: (token: string, newPassword: string) =>
      apiRequest("/auth/reset-password", { method: "POST", body: { token, newPassword }, authenticated: false }),
  },
  contact: {
    send: (body: { name: string; email: string; message: string }) =>
      apiRequest("/contact", { method: "POST", body, authenticated: false }),
  },
  users: {
    me: () => apiRequest("/users/me"),
    updateMe: (body: unknown) => apiRequest("/users/me", { method: "PATCH", body }),
    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      apiRequest("/users/me/password", { method: "PATCH", body }),
    addresses: () => apiRequest("/users/me/addresses"),
    addAddress: (body: unknown) => apiRequest("/users/me/addresses", { method: "POST", body }),
    deleteAddress: (id: string) => apiRequest(`/users/me/addresses/${id}`, { method: "DELETE" }),
  },
  categories: {
    list: () => apiRequest("/categories", { authenticated: false }),
  },
  products: {
    list: (query: string = "") => apiRequest(`/products${query}`, { authenticated: false }),
    get: (id: string) => apiRequest(`/products/${id}`, { authenticated: false }),
  },
  orders: {
    create: (body: unknown) => apiRequest("/orders", { method: "POST", body }),
    mine: () => apiRequest("/orders/mine"),
    get: (id: string) => apiRequest(`/orders/${id}`),
  },
  customRequests: {
    create: (body: unknown) => apiRequest("/custom-requests", { method: "POST", body }),
    mine: () => apiRequest("/custom-requests/mine"),
  },
  wallet: {
    mine: () => apiRequest("/wallet/mine"),
  },
  delivery: {
    myAssignments: () => apiRequest("/delivery/my-assignments"),
  },
  admin: {
    analytics: () => apiRequest("/admin/analytics/overview"),
    products: {
      list: (query: string = "") => apiRequest(`/products${query}`, { authenticated: false }),
      create: (body: unknown) => apiRequest("/admin/products", { method: "POST", body }),
      update: (id: string, body: unknown) => apiRequest(`/admin/products/${id}`, { method: "PATCH", body }),
      deactivate: (id: string) => apiRequest(`/admin/products/${id}`, { method: "DELETE" }),
    },
    categories: {
      list: () => apiRequest("/categories", { authenticated: false }),
      create: (body: unknown) => apiRequest("/admin/categories", { method: "POST", body }),
      update: (id: string, body: unknown) => apiRequest(`/admin/categories/${id}`, { method: "PATCH", body }),
      deactivate: (id: string) => apiRequest(`/admin/categories/${id}`, { method: "DELETE" }),
    },
    orders: {
      list: (query: string = "") => apiRequest(`/admin/orders${query}`),
      updateStatus: (id: string, body: unknown) => apiRequest(`/admin/orders/${id}/status`, { method: "PATCH", body }),
      assign: (id: string, deliveryStaffId: string) => apiRequest(`/admin/orders/${id}/assign`, { method: "PATCH", body: { deliveryStaffId } }),
      uploadProof: (id: string, formData: FormData) => apiRequest(`/admin/orders/${id}/delivery-proof`, { method: "POST", body: formData, isFormData: true }),
      uploadSupplierInvoice: (id: string, body: unknown) => apiRequest(`/admin/orders/${id}/supplier-invoice`, { method: "POST", body }),
    },
    customRequests: {
      list: (query: string = "") => apiRequest(`/admin/custom-requests${query}`),
      quote: (id: string, body: unknown) => apiRequest(`/admin/custom-requests/${id}/quote`, { method: "PATCH", body }),
      convert: (id: string) => apiRequest(`/admin/custom-requests/${id}/convert`, { method: "POST" }),
      decline: (id: string, note?: string) => apiRequest(`/admin/custom-requests/${id}/decline`, { method: "PATCH", body: { note } }),
    },
    refunds: {
      list: (query: string = "") => apiRequest(`/admin/refunds${query}`),
      request: (orderId: string, reason: string) => apiRequest(`/admin/orders/${orderId}/refund-request`, { method: "POST", body: { reason } }),
      process: (orderId: string) => apiRequest(`/admin/orders/${orderId}/refund-process`, { method: "POST" }),
    },
    users: {
      list: (query: string = "") => apiRequest(`/admin/users${query}`),
      updateRole: (id: string, role: string) => apiRequest(`/admin/users/${id}/role`, { method: "PATCH", body: { role } }),
      setActive: (id: string, isActive: boolean) => apiRequest(`/admin/users/${id}/status`, { method: "PATCH", body: { isActive } }),
    },
    contact: {
      list: () => apiRequest("/admin/contact"),
      markRead: (id: string, isRead: boolean) => apiRequest(`/admin/contact/${id}/read`, { method: "PATCH", body: { isRead } }),
    },
    staff: {
      list: () => apiRequest("/admin/staff?staff=true&pageSize=100"),
      create: (body: { fullName: string; email: string; password: string; role: string; phone?: string }) =>
        apiRequest("/admin/staff", { method: "POST", body }),
      updateRole: (id: string, role: string) => apiRequest(`/admin/staff/${id}/role`, { method: "PATCH", body: { role } }),
      setPassword: (id: string, newPassword: string) => apiRequest(`/admin/staff/${id}/password`, { method: "PATCH", body: { newPassword } }),
      setActive: (id: string, isActive: boolean) => apiRequest(`/admin/staff/${id}/status`, { method: "PATCH", body: { isActive } }),
    },
  },
};

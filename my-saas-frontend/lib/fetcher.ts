import { getAccessToken, rehydrateAccessToken } from "./tokenManager";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Prevent multiple simultaneous refresh attempts
let refreshPromise: Promise<boolean> | null = null;

function buildUrl(path: string) {
  const prefix = "/api/v1";

  if (!path.startsWith("/")) {
    return `${API_BASE_URL}${prefix}/${path}`;
  }
  return `${API_BASE_URL}${prefix}${path}`;
}


/**
 * Attempt to refresh access token (prevents race conditions)
 */
async function attemptRefreshIfNeeded(): Promise<boolean> {
  // If refresh is already in progress, wait for it
  if (refreshPromise) {
    return await refreshPromise;
  }

  const refreshPromiseInternal = (async () => {
    try {
      // Lazy import to avoid circular dependency
      const { refreshAccessToken } = await import("./auth");
      await refreshAccessToken();
      return true;
    } catch {
      return false;
    }
  })();

  refreshPromise = refreshPromiseInternal;

  try {
    const result = await refreshPromiseInternal;
    return result;
  } finally {
    refreshPromise = null;
  }
}

export async function backendFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  // On first call, try to rehydrate access token if in memory is null
  if (retryCount === 0) {
    const accessToken = getAccessToken();
    if (!accessToken) {
      await rehydrateAccessToken();
    }
  }

  const accessToken = getAccessToken();
  const headers = new Headers(options.headers || {});

  // Add Authorization header if token exists
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // Ensure Content-Type for JSON requests (unless overridden)
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path), {
    credentials: "include",
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  // Handle 401 Unauthorized
  if (response.status === 401 && retryCount === 0) {
    // Try to refresh token
    const refreshed = await attemptRefreshIfNeeded();

    if (refreshed) {
      // Retry the original request once
      return backendFetch<T>(path, options, retryCount + 1);
    } else {
      // Refresh failed → logout
      const { logout } = await import("./auth");
      await logout();
      const error = new Error("Session expired. Please login again.");
      (error as any).status = 401;
      throw error;
    }
  }

  if (!response.ok) {
    const error = new Error(
      data?.detail || data?.message || response.statusText
    );
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return data as T;
}
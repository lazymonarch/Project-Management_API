import { getAccessToken } from "./tokenManager"; 

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Prevent multiple simultaneous refresh attempts
let refreshPromise: Promise<boolean> | null = null;

function buildUrl(path: string) {
  const prefix = "/api/v1";
  // Ensure path starts with / and remove double slashes if any
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${prefix}${cleanPath}`;
}

/**
 * Attempt to refresh access token (prevents race conditions)
 */
async function attemptRefreshIfNeeded(): Promise<boolean> {
  if (refreshPromise) {
    return await refreshPromise;
  }

  const refreshPromiseInternal = (async () => {
    try {
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
  const accessToken = getAccessToken();
  const headers = new Headers(options.headers || {});

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(buildUrl(path), {
      credentials: "include",
      ...options,
      headers,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    // Handle 401 Unauthorized
    if (response.status === 401 && retryCount === 0) {
      const refreshed = await attemptRefreshIfNeeded();
      if (refreshed) {
        return backendFetch<T>(path, options, retryCount + 1);
      } else {
        const { logout } = await import("./auth");
        await logout();
        const error = new Error("Session expired. Please login again.");
        (error as any).status = 401;
        throw error;
      }
    }

    if (!response.ok) {
      let errorMessage = response.statusText || "Request failed";

      if (data) {
        if (typeof data.detail === "string") {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          // Handle Pydantic validation array
          errorMessage = data.detail
            .map((e: any) => `${e.loc ? e.loc.join('.') : 'Error'}: ${e.msg}`)
            .join(", ");
        } else if (data.message) {
          errorMessage = data.message;
        } else {
           // Fallback for unknown objects: convert to string to see the error
           errorMessage = JSON.stringify(data);
        }
      }

      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).data = data;
      throw error;
    }

    return data as T;
  } catch (error: any) {
    console.error("BackendFetch Error:", error);
    throw error;
  }
}
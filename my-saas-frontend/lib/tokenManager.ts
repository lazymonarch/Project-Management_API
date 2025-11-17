/**
 * Token Manager
 * -------------------------------
 * Access Token   → Memory (volatile, secure)
 * Refresh Token  → localStorage (persistent)
 * Session ID     → localStorage (persistent)
 * User Profile   → localStorage (persistent)
 */

let IN_MEMORY_ACCESS_TOKEN: string | null = null;

const STORAGE_KEYS = {
  REFRESH_TOKEN: "tf_refresh_token",
  SESSION_ID: "tf_session_id",
  USER: "tf_user",
};

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  session_id: string;
  token_type: string;
  expires_in: number;
}

export interface StoredUser {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  role: "admin" | "manager" | "developer";
}

/* --------------------------------------------------
 * Save tokens + user
 * -------------------------------------------------- */
export function storeTokens(tokens: AuthTokens, user?: StoredUser) {
  // Access token stored in memory only
  IN_MEMORY_ACCESS_TOKEN = tokens.access_token;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, tokens.session_id);

    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  }
}

/* --------------------------------------------------
 * Read access token (memory)
 * -------------------------------------------------- */
export function getAccessToken(): string | null {
  return IN_MEMORY_ACCESS_TOKEN;
}

/* --------------------------------------------------
 * Read refresh token + session ID (localStorage)
 * -------------------------------------------------- */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.SESSION_ID);
}

/* --------------------------------------------------
 * Read user data (localStorage)
 * -------------------------------------------------- */
export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    // corrupted or invalid JSON → clear it
    localStorage.removeItem(STORAGE_KEYS.USER);
    return null;
  }
}

/* --------------------------------------------------
 * Quick auth check
 * -------------------------------------------------- */
export function isAuthenticated(): boolean {
  return (
    IN_MEMORY_ACCESS_TOKEN !== null &&
    getRefreshToken() !== null &&
    getSessionId() !== null
  );
}

/* --------------------------------------------------
 * Rehydrate Access Token (App Router safe)
 * --------------------------------------------------
 * Called when:
 * - user refreshes page
 * - accessing dashboard after navigation
 * - memory token wiped during SSR hydration
 *
 * This function:
 * 1. Checks refresh token + session ID
 * 2. Calls refreshAccessToken() safely
 * 3. Restores access token into memory
 * -------------------------------------------------- */
export async function rehydrateAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  const sessionId = getSessionId();

  if (!refreshToken || !sessionId) return false;

  try {
    const { refreshAccessToken } = await import("./auth");
    await refreshAccessToken();
    return true;
  } catch (err) {
    console.error("[rehydrateAccessToken] Failed:", err);
    clearTokens();
    return false;
  }
}

/* --------------------------------------------------
 * Clear everything (Logout)
 * -------------------------------------------------- */
export function clearTokens() {
  IN_MEMORY_ACCESS_TOKEN = null;

  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

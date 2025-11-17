// lib/auth.ts

import {
  storeTokens,
  clearTokens,
  getRefreshToken,
  getSessionId,
  getAccessToken,
  type AuthTokens,
  type StoredUser,
} from "./tokenManager";

import { backendFetch } from "./fetcher";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// -----------------------------
// TYPES
// -----------------------------
export type UserRole = "admin" | "manager" | "developer";

export type User = {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  role?: UserRole;
};

// ==========================================================================
// REGISTER (RAW FETCH — NEVER backendFetch)
// ==========================================================================
export async function register(payload: {
  fullName: string;
  username: string;
  email: string;
  password: string;
}): Promise<AuthTokens & { user: StoredUser }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: payload.email,
      username: payload.username,
      full_name: payload.fullName,
      password: payload.password,
    }),
  });

  if (!res.ok) {
    console.error("REGISTER ERROR:", await res.text());
    throw new Error("Registration failed");
  }

  const json = await res.json();
  const tokens = json.data;

  storeTokens(tokens);

  const user = await fetchUserProfile();
  storeTokens(tokens, user);

  return { ...tokens, user };
}

// ==========================================================================
// LOGIN (RAW FETCH — NEVER backendFetch)
// ==========================================================================
export async function login(payload: {
  email: string;
  password: string;
}): Promise<AuthTokens & { user: StoredUser }> {
  const formBody = new URLSearchParams();
  formBody.append("username", payload.email);
  formBody.append("password", payload.password);

  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody.toString(),
  });

  if (!res.ok) {
    console.error("LOGIN ERROR:", await res.text());
    throw new Error("Login failed");
  }

  const json = await res.json();
  console.log("RAW LOGIN JSON:", json);

  if (!json.data) {
    console.error("BROKEN LOGIN JSON:", json);
    throw new Error("Server did not return tokens");
  }

  const tokens = json.data;

  if (!tokens.access_token) {
    console.error("INVALID TOKEN SHAPE:", tokens);
    throw new Error("Invalid login response");
  }

  storeTokens(tokens);

  // STEP 2 — fetch user profile
  const user = await fetchUserProfile();
  storeTokens(tokens, user);

  return { ...tokens, user };
}

// ==========================================================================
// FETCH USER PROFILE (RAW FETCH — NOT backendFetch)
// ==========================================================================
export async function fetchUserProfile(): Promise<StoredUser> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Missing access token");
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    method: "GET",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    console.error("ME ERROR:", await res.text());
    throw new Error("Failed to load user");
  }

  const json = await res.json();
  console.log("RAW ME JSON:", json);

  return json.data as StoredUser;
}

// ==========================================================================
// REFRESH TOKEN  (backendFetch is allowed here AFTER login)
// ==========================================================================
export async function refreshAccessToken(): Promise<AuthTokens> {
  const refreshToken = getRefreshToken();
  const sessionId = getSessionId();

  if (!refreshToken || !sessionId) {
    throw new Error("No refresh token available");
  }

  const response = await backendFetch<{ message: string; data: AuthTokens }>(
    "/auth/refresh",
    {
      method: "POST",
      body: JSON.stringify({
        refresh_token: refreshToken,
        session_id: sessionId,
      }),
    }
  );

  const tokens = response.data;
  storeTokens(tokens);

  return tokens;
}

// ==========================================================================
// LOGOUT (SAFE)
// ==========================================================================
export async function logout() {
  const sessionId = getSessionId();

  try {
    if (sessionId) {
      await backendFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId }),
      });
    }
  } finally {
    clearTokens();
  }
}

// ==========================================================================
// SESSION CHECK (For ProtectedClientWrapper)
// ==========================================================================
export async function getSessionFromServer() {
  const response = await fetch("/api/auth/session", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Not authenticated");
  }

  return (await response.json()) as { user: User | null };
}

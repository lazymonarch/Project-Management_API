"use client";  // ← ADD THIS LINE

export async function apiFetch(
  endpoint: string,
  token?: string,
  options: RequestInit = {}
) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  console.log("API URL:", baseUrl);

  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "API request failed");
  }

  return res.json();
}

export const api = {
  get: (endpoint: string, token?: string) =>
    apiFetch(endpoint, token, { method: "GET" }),

  post: (endpoint: string, token: string | undefined, body: any) =>
    apiFetch(endpoint, token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: (endpoint: string, token: string | undefined, body: any) =>
    apiFetch(endpoint, token, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (endpoint: string, token?: string) =>
    apiFetch(endpoint, token, { method: "DELETE" }),
};

export function getToken() {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem("access_token") ?? undefined;
}

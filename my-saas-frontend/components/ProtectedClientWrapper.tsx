"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  getAccessToken,
  getStoredUser,
  rehydrateAccessToken,
  type StoredUser,
} from "@/lib/tokenManager";

interface ProtectedClientWrapperProps {
  children: (data: { user: StoredUser }) => ReactNode;
  requiredRole?: "admin" | "manager" | "developer";
  loadingLabel?: string;
}

export function ProtectedClientWrapper({
  children,
  requiredRole,
  loadingLabel = "Loading...",
}: ProtectedClientWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        // 1️⃣ Try memory token
        let accessToken = getAccessToken();

        // 2️⃣ If memory token empty → rehydrate from refresh token
        if (!accessToken) {
          const ok = await rehydrateAccessToken();
          if (!ok) throw new Error("No access token");
          accessToken = getAccessToken();
        }

        // 3️⃣ Load user from storage
        const storedUser = getStoredUser();
        if (!storedUser) throw new Error("Missing user");

        // 4️⃣ Role check
        if (requiredRole && storedUser.role !== requiredRole) {
          throw new Error("Unauthorized role");
        }

        if (!cancelled) {
          setUser(storedUser);
        }
      } catch (err) {
        console.error("Auth failed:", err);

        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [requiredRole]);

  // 🔵 Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{loadingLabel}</p>
      </div>
    );
  }

  // 🔴 Auth failed
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-red-600">Authentication failed.</p>
          <a href="/login" className="btn-primary px-6 py-2">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // ✅ Auth success → render content
  return <>{children({ user })}</>;
}

"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { ProtectedClientWrapper } from "@/components/ProtectedClientWrapper";

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch {
      alert("Unable to logout. Please try again.");
    }
  };

  return (
    <ProtectedClientWrapper loadingLabel="Loading dashboard...">
      {({ user }) => (
        <div className="space-y-6">
          <div>
            <p className="text-sm uppercase font-semibold tracking-wide text-slate-500">
              Dashboard
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome, {user.full_name || user.email}
            </h1>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Signed in as</p>
            <p className="text-lg font-semibold text-slate-900">{user.email}</p>
            <p className="text-sm text-slate-500">
              Role: {user.role ?? "unknown"}
            </p>

            <div className="mt-6 flex items-center gap-4">
              <button className="btn" onClick={handleLogout}>
                Logout
              </button>
              {user.role === "admin" && (
                <button
                  className="btn-primary"
                  onClick={() => router.push("/admin")}
                >
                  Go to admin area
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ProtectedClientWrapper>
  );
}


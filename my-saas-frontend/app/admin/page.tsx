"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { ProtectedClientWrapper } from "@/components/ProtectedClientWrapper";

export default function AdminPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <ProtectedClientWrapper requiredRole="admin" loadingLabel="Loading admin panel...">
      {({ user }) => (
        <div className="space-y-8">
          <div>
            <p className="text-sm uppercase font-semibold tracking-wide text-slate-500">
              ADMIN PANEL
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome, {user.full_name || user.email}
            </h1>
            <p className="text-slate-500 mt-1">Role: {user.role}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <p className="text-lg font-semibold text-slate-900">
              Admin Controls
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <button
                className="btn-primary"
                onClick={() => router.push("/admin/users")}
              >
                Manage Users
              </button>

              <button
                className="btn-primary"
                onClick={() => router.push("/admin/projects")}
              >
                Manage Projects
              </button>

            </div>

            <button className="btn mt-4" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      )}
    </ProtectedClientWrapper>
  );
}

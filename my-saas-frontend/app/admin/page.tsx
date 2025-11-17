"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { ProtectedClientWrapper } from "@/components/ProtectedClientWrapper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <ProtectedClientWrapper
      requiredRole="admin"
      loadingLabel="Loading admin panel..."
    >
      {({ user }) => (
        <div className="space-y-10">
          {/* Header */}
          <div>
            <p className="text-xs uppercase font-semibold tracking-wide text-slate-500">
              Admin Panel
            </p>

            <h1 className="text-4xl font-bold text-slate-900 mt-1">
              Welcome, {user.full_name || user.email}
            </h1>

            <p className="text-slate-500 mt-1">
              Role: <span className="font-medium">{user.role}</span>
            </p>
          </div>

          {/* Admin Controls */}
          <Card className="p-8 shadow-sm space-y-8">
            <p className="text-xl font-semibold text-slate-900">
              Admin Controls
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Button
                className="h-14 text-lg rounded-xl"
                onClick={() => router.push("/admin/users")}
              >
                Manage Users
              </Button>

              <Button
                className="h-14 text-lg rounded-xl"
                onClick={() => router.push("/admin/projects")}
              >
                Manage Projects
              </Button>
            </div>

            <Button
              variant="outline"
              className="mt-4"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Card>
        </div>
      )}
    </ProtectedClientWrapper>
  );
}

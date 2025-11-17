"use client";

import { ProtectedClientWrapper } from "@/components/ProtectedClientWrapper";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedClientWrapper requiredRole="admin" loadingLabel="Checking admin access...">
      {() => <>{children}</>}
    </ProtectedClientWrapper>
  );
}

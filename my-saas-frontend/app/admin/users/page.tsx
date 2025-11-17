"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { getToken, api } from "@/lib/api"; // your wrapper
import { Badge } from "@/components/ui/badge";

export default function ManageUsersPage() {
  const router = useRouter();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const token = getToken();
      return api.get("/api/v1/users", token);
    },
  });

  if (isLoading) return <p className="p-8">Loading users...</p>;
  if (error) return <p className="p-8 text-red-600">Failed to load users</p>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Manage Users</h1>

      <Card className="p-4 shadow-md rounded-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {data?.data?.map((u: any) => (
              <tr key={u.id} className="border-b">
                <td className="p-3">{u.full_name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <Badge className="capitalize">{u.role}</Badge>
                </td>
                <td className="p-3 space-x-3">
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/admin/users/${u.id}`)}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={async () => {
                      await api.delete(`/api/v1/users/${u.id}`, getToken());
                      refetch();
                    }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

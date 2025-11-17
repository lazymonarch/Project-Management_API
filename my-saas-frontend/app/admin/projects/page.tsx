"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, getToken } from "@/lib/api";

export default function ManageProjectsPage() {
  const router = useRouter();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      return api.get("/api/v1/projects", getToken());
    },
  });

  if (isLoading) return <p className="p-8">Loading projects...</p>;
  if (error) return <p className="p-8 text-red-600">Failed to load projects</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Projects</h1>

        <Button onClick={() => router.push("/admin/projects/new")}>
          Create Project
        </Button>
      </div>

      <Card className="p-4 shadow-md rounded-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-3">Name</th>
              <th className="p-3">Status</th>
              <th className="p-3">Owner</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {data?.data?.map((p: any) => (
              <tr key={p.id} className="border-b">
                <td className="p-3">{p.name}</td>

                <td className="p-3">
                  <Badge className="capitalize">{p.status}</Badge>
                </td>

                <td className="p-3">{p.owner?.full_name ?? "Unknown"}</td>

                <td className="p-3 space-x-3">
                  <Button variant="secondary"
                    onClick={() => router.push(`/admin/projects/${p.id}`)}>
                    View
                  </Button>

                  <Button
                    onClick={() => router.push(`/admin/projects/${p.id}/edit`)}
                  >
                    Edit
                  </Button>

                  <Button variant="destructive"
                    onClick={async () => {
                      await api.delete(`/api/v1/projects/${p.id}`, getToken());
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

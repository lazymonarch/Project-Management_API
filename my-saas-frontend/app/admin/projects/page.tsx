"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { backendFetch } from "@/lib/fetcher";

// ✅ FIX: Define the types for the project and the API response
interface Project {
  id: string;
  name: string;
  status: string;
  // Based on your backend schema, the project list response
  // does not include the full owner details.
  owner_id: string; 
}

interface ProjectListResponse {
  message: string;
  data: Project[];
  pagination: any;
}

export default function ManageProjectsPage() {
  const router = useRouter();

  const {
    data,
    isLoading,
    error,
    refetch
    // ✅ FIX: Pass the response type to useQuery
  } = useQuery<ProjectListResponse>({
    queryKey: ["projects"],
    queryFn: async () => {
      // ✅ FIX: Pass the response type to backendFetch
      return backendFetch<ProjectListResponse>("/projects");
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
              <th className="p-3">Owner ID</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {/* data is now correctly typed as ProjectListResponse | undefined */}
            {data?.data?.map((p: Project) => ( // ✅ FIX: Use the Project type
              <tr key={p.id} className="border-b">
                <td className="p-3">{p.name}</td>

                <td className="p-3">
                  <Badge className="capitalize">{p.status}</Badge>
                </td>
                
                {/* Your backend's list-projects endpoint returns 'owner_id'
                    not the full owner object. Displaying the ID is correct. */}
                <td className="p-3 text-xs font-mono">{p.owner_id}</td>

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
                      await backendFetch(`/projects/${p.id}`, { method: "DELETE" });
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
"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { backendFetch } from "../../../lib/fetcher";
import { ArrowLeft } from "lucide-react";

interface Project {
  id: string;
  name: string;
  status: string;
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
  } = useQuery<ProjectListResponse>({
    queryKey: ["projects"],
    queryFn: async () => {
      return backendFetch<ProjectListResponse>("/projects");
    },
  });

  if (isLoading) return <p className="p-8">Loading projects...</p>;
  if (error) return <p className="p-8 text-red-600">Failed to load projects</p>;

  return (
    <div className="p-8 space-y-6">
      {/* Back Button */}
      <div>
        <Button 
          variant="ghost" 
          className="pl-0 gap-2 text-slate-500 hover:text-slate-900 hover:bg-transparent"
          onClick={() => router.push("/admin")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Panel
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">All Projects (Read Only)</h1>
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
            {data?.data?.map((p: Project) => (
              <tr key={p.id} className="border-b">
                <td className="p-3">{p.name}</td>

                <td className="p-3">
                  <Badge className="capitalize">{p.status}</Badge>
                </td>
                
                <td className="p-3 text-xs font-mono">{p.owner_id}</td>

                <td className="p-3 space-x-3">
                  <Button variant="secondary"
                    onClick={() => router.push(`/admin/projects/${p.id}`)}>
                    View Details
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
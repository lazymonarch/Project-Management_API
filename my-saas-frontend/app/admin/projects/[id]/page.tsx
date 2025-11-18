"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProtectedClientWrapper } from "@/components/ProtectedClientWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { backendFetch } from "@/lib/fetcher"; // Use @ alias if configured, or relative path

interface ProjectSummary {
  project_id: string;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  task_overview: {
    total: number;
    completed_percentage: number;
    by_status: Record<string, number>;
  };
}

export default function AdminProjectViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  // Fetch Project Summary (Admins can view summary)
  const { data: response, isLoading, error } = useQuery({
    queryKey: ["project-admin", id],
    queryFn: async () => {
        // Admin uses the same summary endpoint
        return backendFetch<{ data: ProjectSummary }>(`/projects/${id}/summary`);
    },
    enabled: !!id,
  });
  
  const project = response?.data;

  if (isLoading) return <div className="p-8">Loading project...</div>;
  if (error || !project) return <div className="p-8 text-red-600">Project not found.</div>;

  // Formatting helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <ProtectedClientWrapper requiredRole="admin" loadingLabel="Verifying admin access...">
      {() => (
        <div className="p-8 space-y-8">
          <div>
            <Button 
              variant="ghost" 
              className="pl-0 gap-2 text-slate-500 hover:text-slate-900 hover:bg-transparent"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </div>

          <div className="flex justify-between items-start">
             <div>
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <p className="text-slate-500 mt-1">Project ID: {project.project_id}</p>
             </div>
             <Badge className="text-lg px-4 py-1 capitalize">{project.status}</Badge>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <Card className="p-4 bg-blue-50 border-blue-100">
                <p className="text-sm text-blue-600 font-semibold">Progress</p>
                <p className="text-2xl font-bold text-blue-900">{project.task_overview.completed_percentage}%</p>
             </Card>
             <Card className="p-4">
                <p className="text-sm text-slate-500 font-semibold">Total Tasks</p>
                <p className="text-2xl font-bold text-slate-900">{project.task_overview.total}</p>
             </Card>
             {/* Add more stats here later */}
          </div>

          {/* Read Only Details */}
          <Card className="p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Project Details</h2>
            <div className="space-y-6">
                <div>
                    <Label className="text-slate-500">Description</Label>
                    <p className="text-lg text-slate-900 mt-1">{project.description || "No description provided."}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <Label className="text-slate-500">Start Date</Label>
                        <p className="text-lg text-slate-900 mt-1">{formatDate(project.start_date)}</p>
                    </div>
                    <div>
                        <Label className="text-slate-500">End Date</Label>
                        <p className="text-lg text-slate-900 mt-1">{formatDate(project.end_date)}</p>
                    </div>
                </div>
            </div>
          </Card>
        </div>
      )}
    </ProtectedClientWrapper>
  );
}
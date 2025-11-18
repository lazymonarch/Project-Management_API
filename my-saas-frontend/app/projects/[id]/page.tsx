"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ProtectedClientWrapper } from "@/components/ProtectedClientWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { backendFetch } from "@/lib/fetcher";

// Types
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

interface UpdateProjectInput {
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
}

export default function ManagerProjectPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { register, handleSubmit, setValue } = useForm<UpdateProjectInput>();

  // 1. Fetch Project Summary
  const { data: response, isLoading, error } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
        // We use the summary endpoint because it returns everything + stats
        return backendFetch<{ data: ProjectSummary }>(`/projects/${id}/summary`);
    },
    enabled: !!id,
  });
  
  const project = response?.data;

  // 2. Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProjectInput) => {
        const payload = {
            ...data,
            description: data.description || null,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
        };
        return backendFetch(`/projects/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["project", id] });
        alert("Project updated successfully");
    },
    onError: (err: any) => alert(err.message),
  });

  // 3. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
        return backendFetch(`/projects/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["my-projects"] });
        router.push("/dashboard");
    },
    onError: (err: any) => alert(err.message),
  });

  if (isLoading) return <div className="p-8">Loading project...</div>;
  if (error || !project) return <div className="p-8 text-red-600">Project not found or access denied.</div>;

  const onSave = (data: UpdateProjectInput) => {
    updateMutation.mutate(data);
  };

  // Helper to format dates for input fields (YYYY-MM-DD)
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().split('T')[0];
  };

  return (
    <ProtectedClientWrapper requiredRole="manager" loadingLabel="Checking access...">
      {() => (
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" className="pl-0 gap-2" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => {
                    if(confirm("Delete this project? This cannot be undone.")) deleteMutation.mutate();
                }}
            >
                <Trash2 className="h-4 w-4 mr-2" /> Delete Project
            </Button>
          </div>

          <div>
             <h1 className="text-3xl font-bold">{project.name}</h1>
             <div className="flex gap-3 mt-2">
                <Badge className="capitalize">{project.status}</Badge>
                <span className="text-slate-500 text-sm flex items-center">
                    {project.task_overview.completed_percentage}% Complete
                </span>
             </div>
          </div>

          {/* Edit Form */}
          <Card className="p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <form onSubmit={handleSubmit(onSave)} className="space-y-4 max-w-xl">
                
                <div className="space-y-2">
                    <Label>Name</Label>
                    <Input defaultValue={project.name} {...register("name")} />
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>
                    <Input defaultValue={project.description} {...register("description")} />
                </div>

                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select onValueChange={(val) => setValue("status", val)} defaultValue={project.status}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" defaultValue={formatDate(project.start_date)} {...register("start_date")} />
                    </div>
                    <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="date" defaultValue={formatDate(project.end_date)} {...register("end_date")} />
                    </div>
                </div>

                <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
            </form>
          </Card>

          {/* Task Placeholder (Next Step) */}
          <Card className="p-6 bg-slate-50 border-dashed border-2">
             <h3 className="text-lg font-medium text-slate-700">Tasks</h3>
             <p className="text-slate-500">Task management will be implemented in Phase 3.</p>
          </Card>
        </div>
      )}
    </ProtectedClientWrapper>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ProtectedClientWrapper } from "@/components/ProtectedClientWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { backendFetch } from "@/lib/fetcher";

// --- Types ---
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

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigned_to: string | null;
}

interface CreateTaskInput {
  title: string;
  priority: string;
  assigned_to: string;
}

interface UpdateProjectInput {
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface User {
  id: string;
  full_name: string;
  role: string;
}

export default function ManagerProjectPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  // Forms
  const { 
      register: registerProject, 
      handleSubmit: handleProjectSubmit, 
      setValue: setProjectValue,
      reset: resetProjectForm
  } = useForm<UpdateProjectInput>();

  const { 
      register: registerTask, 
      handleSubmit: handleTaskSubmit, 
      reset: resetTaskForm, 
      setValue: setTaskValue 
  } = useForm<CreateTaskInput>();

  // 1. Fetch Project Summary
  const { data: projectRes, isLoading: projectLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => backendFetch<{ data: ProjectSummary }>(`/projects/${id}/summary`),
    enabled: !!id,
  });
  const project = projectRes?.data;

  // Helper to format date for input
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().split('T')[0];
  };

  // Reset project form when data loads
  useEffect(() => {
    if (project) {
        resetProjectForm({
            name: project.name,
            description: project.description,
            status: project.status,
            start_date: formatDate(project.start_date),
            end_date: formatDate(project.end_date),
        });
    }
  }, [project, resetProjectForm]);


  // 2. Fetch Tasks
  const { data: tasksRes } = useQuery({
    queryKey: ["project-tasks", id],
    queryFn: async () => backendFetch<{ data: Task[] }>(`/tasks/project/${id}`),
    enabled: !!id,
  });
  const tasks = tasksRes?.data || [];

  // 3. Fetch Developers for Assignment
  const { data: usersRes } = useQuery({
    queryKey: ["developers"],
    queryFn: async () => backendFetch<{ data: User[] }>("/users?role=developer"),
  });
  const developers = usersRes?.data || [];

  // --- Mutations ---

  const createTaskMutation = useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      const payload = {
        ...data,
        project_id: id,
        status: "todo", 
        description: "", 
        assigned_to: data.assigned_to || null,
      };
      return backendFetch("/tasks/", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", id] });
      queryClient.invalidateQueries({ queryKey: ["project", id] }); 
      setIsTaskDialogOpen(false);
      resetTaskForm();
    },
    onError: (err: any) => alert(err.message),
  });

  const updateProjectMutation = useMutation({
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

  if (projectLoading) return <div className="p-8">Loading...</div>;
  if (!project) return <div className="p-8">Project not found.</div>;

  const onTaskSubmit = (data: CreateTaskInput) => createTaskMutation.mutate(data);
  const onProjectSave = (data: UpdateProjectInput) => updateProjectMutation.mutate(data);

  return (
    <ProtectedClientWrapper requiredRole="manager">
      {() => (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" className="pl-0 gap-2" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => {
                    if(confirm("Delete this project?")) deleteMutation.mutate();
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

          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Tasks</h2>
                <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="h-4 w-4 mr-2" /> Add Task</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Task</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleTaskSubmit(onTaskSubmit)} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Task Title</Label>
                                <Input {...registerTask("title", { required: true })} placeholder="Fix login bug" />
                            </div>
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select onValueChange={(v) => setTaskValue("priority", v)} defaultValue="medium">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Assign To (Developer)</Label>
                                <Select onValueChange={(v) => setTaskValue("assigned_to", v)}>
                                    <SelectTrigger><SelectValue placeholder="Select developer" /></SelectTrigger>
                                    <SelectContent>
                                        {developers.map((dev) => (
                                            <SelectItem key={dev.id} value={dev.id}>{dev.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full" disabled={createTaskMutation.isPending}>
                                {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {tasks.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed rounded-xl text-slate-500">
                    No tasks yet. Create one above.
                </div>
            ) : (
                <div className="grid gap-4">
                    {tasks.map((task) => (
                        <Card key={task.id} className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-medium">{task.title}</p>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs capitalize">{task.status.replace('_', ' ')}</Badge>
                                    <Badge variant="secondary" className="text-xs capitalize">{task.priority}</Badge>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
          </div>

          <Card className="p-6 shadow-sm bg-slate-50 mt-10">
            <h3 className="text-lg font-semibold mb-4">Project Settings</h3>
            <form onSubmit={handleProjectSubmit(onProjectSave)} className="space-y-4 max-w-xl">
                
                <div className="space-y-2">
                    <Label>Name</Label>
                    <Input {...registerProject("name")} />
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>
                    <Input {...registerProject("description")} />
                </div>

                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                        onValueChange={(val) => setProjectValue("status", val)} 
                        defaultValue={project.status} 
                    >
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
                        <Input type="date" {...registerProject("start_date")} />
                    </div>
                    <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="date" {...registerProject("end_date")} />
                    </div>
                </div>

                <Button type="submit" disabled={updateProjectMutation.isPending}>
                    {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
            </form>
          </Card>
        </div>
      )}
    </ProtectedClientWrapper>
  );
}
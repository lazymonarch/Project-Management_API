"use client";

import { useRouter } from "next/navigation"; 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProtectedClientWrapper } from "@/components/ProtectedClientWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react"; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { backendFetch } from "@/lib/fetcher";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  project_id: string;
}

export default function MyTasksPage() {
  const router = useRouter(); 
  const queryClient = useQueryClient();

  // Fetch tasks assigned to the current user
  const { data: response, isLoading } = useQuery({
    queryKey: ["my-tasks"],
    queryFn: async () => backendFetch<{ data: Task[] }>("/tasks"),
  });

  const tasks = response?.data || [];

  // Mutation to update status
  const statusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      return backendFetch(`/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
    },
    onError: (err: any) => alert("Failed to update status"),
  });

  return (
    <ProtectedClientWrapper requiredRole="developer" loadingLabel="Loading your tasks...">
      {() => (
        <div className="space-y-6">
          <div>
            <Button 
              variant="ghost" 
              className="pl-0 gap-2 text-slate-500 hover:text-slate-900 hover:bg-transparent"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Assigned Tasks</h1>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {tasks.length} Tasks
            </Badge>
          </div>

          {isLoading ? (
            <p>Loading...</p>
          ) : tasks.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
                <p className="text-slate-500">You have no tasks assigned. Lucky you!</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tasks.map((task) => (
                    <Card key={task.id} className="p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant={task.priority === 'critical' ? 'destructive' : 'secondary'} className="capitalize">
                                    {task.priority}
                                </Badge>
                                <span className="text-xs text-slate-400 font-mono">ID: {task.id.slice(0, 4)}</span>
                            </div>
                            <h3 className="font-semibold text-lg leading-tight">{task.title}</h3>
                        </div>
                        
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Status</label>
                            <Select 
                                defaultValue={task.status} 
                                onValueChange={(val) => statusMutation.mutate({ taskId: task.id, status: val })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todo">To Do</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="review">In Review</SelectItem>
                                    <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </Card>
                ))}
            </div>
          )}
        </div>
      )}
    </ProtectedClientWrapper>
  );
}
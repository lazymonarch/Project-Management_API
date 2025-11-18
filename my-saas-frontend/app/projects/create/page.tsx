"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ProtectedClientWrapper } from "@/components/ProtectedClientWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { backendFetch } from "@/lib/fetcher";

interface CreateProjectInput {
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateProjectInput>();

  const mutation = useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      // ✅ POST to create project
      return backendFetch("/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/dashboard"); // Go back to dashboard
    },
    onError: (err: any) => {
      alert(err.message || "Failed to create project");
    },
  });

  const onSubmit = (data: CreateProjectInput) => {
    mutation.mutate(data);
  };

  return (
    <ProtectedClientWrapper requiredRole="manager" loadingLabel="Verifying manager access...">
      {() => (
        <div className="p-8 max-w-lg mx-auto">
          <Card className="p-6 shadow-lg rounded-2xl">
            <h1 className="text-2xl font-bold mb-6">Create New Project</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input 
                  {...register("name", { required: "Name is required" })}
                  placeholder="e.g. Website Redesign"
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  {...register("description")}
                  placeholder="Brief project description"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select onValueChange={(val) => setValue("status", val)} defaultValue="planning">
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
                    <Input type="date" {...register("start_date")} />
                 </div>
                 <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" {...register("end_date")} />
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  className="w-full"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                  className="w-full"
                >
                  {mutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>

            </form>
          </Card>
        </div>
      )}
    </ProtectedClientWrapper>
  );
}
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react"; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { backendFetch } from "../../../../lib/fetcher"; 

interface UserDetail {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: "admin" | "manager" | "developer";
}

interface UpdatePayload {
  full_name: string;
  role: string;
}

export default function EditUserPage() {
  const params = useParams();
  const id = params?.id as string; 
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<UpdatePayload>();
  const { data: response, isLoading, error } = useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      if (!id) throw new Error("Invalid ID");
      return backendFetch<{ data: UserDetail }>(`/users/${id}`);
    },
    enabled: !!id,
  });
  const user = response?.data;
  const mutation = useMutation({
    mutationFn: async (data: UpdatePayload) => {
      return backendFetch(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      router.push("/admin/users");
    },
    onError: (err: any) => {
      alert(err.message || "Failed to update user");
    },
  });

  if (isLoading) return <p className="p-8">Loading user details...</p>;
  if (error || !user) return <p className="p-8 text-red-600">User not found.</p>;

  const onSubmit = (data: UpdatePayload) => {
    mutation.mutate(data);
  };

  return (
    <div className="p-8 max-w-lg mx-auto space-y-6">
      <div>
        <Button 
          variant="ghost" 
          className="pl-0 gap-2 text-slate-500 hover:text-slate-900 hover:bg-transparent"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="p-6 shadow-lg rounded-2xl">
        <h1 className="text-2xl font-bold mb-6">Edit User</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ... Form content remains exactly the same ... */}
          
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled className="bg-slate-50" />
          </div>

          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={user.username} disabled className="bg-slate-50" />
          </div>

          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input 
              defaultValue={user.full_name}
              {...register("full_name", { required: "Full name is required" })}
            />
            {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            {user.role === "admin" ? (
               <div className="p-2 border rounded-md bg-slate-50 text-sm text-slate-500">
                 Admin roles cannot be changed here.
               </div>
            ) : (
              <Select 
                onValueChange={(val) => setValue("role", val)} 
                defaultValue={user.role}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                </SelectContent>
              </Select>
            )}
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
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
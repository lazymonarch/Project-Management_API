"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { backendFetch } from "@/lib/fetcher"; 
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react"; 

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface UserListResponse {
  message: string;
  data: User[];
  pagination: any;
}

export default function ManageUsersPage() {
  const router = useRouter();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery<UserListResponse>({
    queryKey: ["users"],
    queryFn: async () => {
      return backendFetch<UserListResponse>("/users"); 
    },
  });

  if (isLoading) return <p className="p-8">Loading users...</p>;
  if (error) return <p className="p-8 text-red-600">Failed to load users</p>;

  return (
    <div className="p-8 space-y-6">
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

      <h1 className="text-3xl font-bold">Manage Users</h1>

      <Card className="p-4 shadow-md rounded-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {data?.data?.map((u: User) => (
              <tr key={u.id} className="border-b">
                <td className="p-3">{u.full_name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <Badge className="capitalize" variant={u.role === 'admin' ? 'default' : 'secondary'}>
                    {u.role}
                  </Badge>
                </td>
                <td className="p-3">
                   <Badge variant={u.is_active ? "outline" : "destructive"}>
                     {u.is_active ? "Active" : "Disabled"}
                   </Badge>
                </td>
                <td className="p-3 space-x-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/admin/users/${u.id}`)}
                  >
                    Edit
                  </Button>

                  {u.role !== 'admin' && u.is_active && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if(!confirm("Are you sure you want to disable this user?")) return;
                        await backendFetch(`/users/${u.id}`, { method: "DELETE" });
                        refetch();
                      }}
                    >
                      Disable
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
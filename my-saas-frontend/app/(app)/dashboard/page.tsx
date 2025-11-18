"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { logout } from "@/lib/auth";
import { ProtectedClientWrapper } from "@/components/ProtectedClientWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { backendFetch } from "@/lib/fetcher";

interface Project {
  id: string;
  name: string;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch {
      alert("Unable to logout. Please try again.");
    }
  };

  const { 
    data: projectsData, 
    isLoading: projectsLoading, 
    isError: projectsError 
  } = useQuery({
    queryKey: ["my-projects"],
    queryFn: async () => backendFetch<{ data: Project[] }>("/projects/"),
  });

  return (
    <ProtectedClientWrapper loadingLabel="Loading dashboard...">
      {({ user }) => (
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm uppercase font-semibold tracking-wide text-slate-500">
                Dashboard
              </p>
              <h1 className="text-3xl font-bold text-slate-900">
                Welcome, {user.full_name || user.email}
              </h1>
              <p className="text-slate-500 mt-1">
                Role: <span className="font-medium capitalize">{user.role}</span>
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>

          {user.role === "admin" && (
            <Card className="p-6 bg-slate-50 border-slate-200">
              <h3 className="font-semibold mb-2 text-lg">Admin Actions</h3>
              <p className="text-slate-500 mb-4">Manage users and view system-wide projects.</p>
              <Button onClick={() => router.push("/admin")}>
                Go to Admin Panel
              </Button>
            </Card>
          )}

          {user.role === "manager" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">My Projects</h2>
                <Button onClick={() => router.push("/projects/create")}>
                  + Create Project
                </Button>
              </div>

              {projectsLoading ? (
                <div className="p-8 text-center">
                  <p className="text-slate-500">Loading projects...</p>
                </div>
              ) : projectsError ? (
                <div className="p-8 text-center border-2 border-red-100 bg-red-50 rounded-xl">
                  <p className="text-red-600">Failed to load projects.</p>
                </div>
              ) : !projectsData?.data || projectsData.data.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed rounded-xl">
                  <p className="text-slate-500 mb-4">No projects found. Create one to get started.</p>
                  <Button variant="outline" onClick={() => router.push("/projects/create")}>
                    Create your first project
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectsData.data.map((p) => (
                    <Card 
                      key={p.id} 
                      className="p-5 hover:shadow-md transition cursor-pointer" 
                      onClick={() => router.push(`/projects/${p.id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-lg">{p.name}</h3>
                        <Badge variant="secondary" className="capitalize">{p.status}</Badge>
                      </div>
                      <p className="text-sm text-slate-400 mt-2">Click to view details</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
          {user.role === "developer" && (
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">My Workflow</h2>
                    <Button onClick={() => router.push("/tasks")}>
                        View My Tasks
                    </Button>
                </div>
                <Card className="p-8 text-center border-dashed">
                  <p className="text-slate-500">Head to the task board to see your assignments.</p>
                </Card>
             </div>
          )}

        </div>
      )}
    </ProtectedClientWrapper>
  );
}
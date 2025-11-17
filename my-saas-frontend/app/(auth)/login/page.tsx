"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/AuthForm";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  async function handleSubmit(data: { email: string; password: string }) {
    try {
      await login(data);
      router.push("/dashboard");
    } catch (error: any) {
      alert(error?.message || "Login failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase font-semibold tracking-wide text-slate-500">
          Welcome back
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Sign in</h1>
      </div>

      <LoginForm onSubmit={handleSubmit} />

      <p className="text-sm text-slate-500">
        Need an account?{" "}
        <Link href="/register" className="font-semibold text-sky-600">
          Register here
        </Link>
      </p>
    </div>
  );
}


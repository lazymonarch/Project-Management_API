"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/AuthForm";
import { register as registerUser } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();

  async function handleSubmit(data: {
    fullName: string;
    username: string;
    email: string;
    password: string;
  }) {
    try {
      // public signup always creates Developer on server; do not send role/invite
      await registerUser({
        fullName: data.fullName,
        username: data.username,
        email: data.email,
        password: data.password,
      });
      router.push("/dashboard");
    } catch (error: any) {
      alert(error?.message || "Registration failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase font-semibold tracking-wide text-slate-500">
          Join the workspace
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Create an account</h1>
      </div>

      <RegisterForm onSubmit={handleSubmit} />

      <p className="text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-sky-600">
          Sign in
        </Link>
      </p>
    </div>
  );
}
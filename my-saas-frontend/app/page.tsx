import Link from "next/link";

export default function HomePage() {
  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm uppercase font-semibold tracking-wide text-slate-500">
          TaskFlow
        </p>
        <h1 className="text-3xl font-bold">Role-aware auth scaffold</h1>
        <p className="text-slate-600">
          Use the login and registration flows below to connect to the FastAPI
          backend.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link href="/login" className="btn-primary">
          Login
        </Link>
        <Link href="/register" className="btn">
          Register
        </Link>
      </div>
    </main>
  );
}


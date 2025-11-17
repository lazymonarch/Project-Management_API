"use client";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-10">
        {children}
      </div>
    </div>
  );
}

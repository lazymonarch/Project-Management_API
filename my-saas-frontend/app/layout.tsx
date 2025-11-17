import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskFlow Frontend",
  description: "Role-aware authentication scaffold for TaskFlow API",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="container mx-auto max-w-4xl p-6">{children}</div>
      </body>
    </html>
  );
}

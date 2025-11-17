import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

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
        <Providers>
          <div className="container mx-auto max-w-4xl p-6">{children}</div>
        </Providers>
      </body>
    </html>
  );
}

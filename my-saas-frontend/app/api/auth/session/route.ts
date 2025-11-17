import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    // Try reading token from header
    let authHeader = request.headers.get("authorization");

    // ALSO try reading token from query or cookie (fallbacks)
    const tokenFromQuery = request.nextUrl.searchParams.get("token");

    if (!authHeader && tokenFromQuery) {
      authHeader = `Bearer ${tokenFromQuery}`;
    }

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ user: null }, { status: 200 }); 
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    if (!res.ok) return NextResponse.json({ user: null }, { status: 200 });

    const backend = await res.json();
    return NextResponse.json({ user: backend.data });

  } catch (err) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

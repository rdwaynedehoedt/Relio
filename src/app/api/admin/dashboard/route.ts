import { NextResponse } from "next/server";
import {
  buildAdminDashboardData,
  verifyAdminIdToken,
} from "@/lib/admin-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const idToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = await verifyAdminIdToken(idToken);
    const data = await buildAdminDashboardData(decoded.uid);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load admin data";

    if (message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("Admin dashboard API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

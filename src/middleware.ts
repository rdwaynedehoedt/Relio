import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth-cookie";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const isAuthenticated =
    request.cookies.get(AUTH_COOKIE)?.value === "1";
  const destination = isAuthenticated ? "/dashboard" : "/home";

  return NextResponse.redirect(new URL(destination, request.url));
}

export const config = {
  matcher: "/",
};

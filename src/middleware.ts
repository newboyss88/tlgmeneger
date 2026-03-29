import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const isAuthPage = req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register";
    const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard");

    if (isAuthPage) {
      if (req.nextauth.token) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return null;
    }

    if (!req.nextauth.token && isDashboardPage) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return null;
  },
  {
    callbacks: {
      authorized: () => true, // middleware() funksiyasini har doim chaqirish uchun
    },
    pages: {
      signIn: "/login",
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
}

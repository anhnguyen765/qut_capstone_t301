import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/register", "/unsub", "/api/auth/login", "/api/auth/register", "/api/test-db"];
  
  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Get the token from the Authorization header or cookies
  const token = request.headers.get("authorization")?.replace("Bearer ", "") ||
                request.cookies.get("authToken")?.value;

  // If it's a public path, allow access
  if (isPublicPath) {
    // If user is already logged in and trying to access login/register, redirect to homepage
    if (token && (pathname === "/login" || pathname === "/register")) {
      try {
        const secret = new TextEncoder().encode(
          "hardcoded_super_secret_key_change_me"
        );
        
        const { payload } = await jwtVerify(token, secret);
        
        // Check if token is expired
        if (payload.exp && payload.exp < Date.now() / 1000) {
          throw new Error("Token expired");
        }

        // Token is valid, redirect to homepage
        const homeUrl = new URL("/", request.url);
        return NextResponse.redirect(homeUrl);
      } catch (error) {
        // Token is invalid, allow access to login/register
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // If no token and trying to access protected route, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verify the JWT token
  try {
    const secret = new TextEncoder().encode(
      "hardcoded_super_secret_key_change_me"
    );
    
    const { payload } = await jwtVerify(token, secret);
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new Error("Token expired");
    }

    // Check if accessing admin routes
    if (pathname.startsWith("/admin")) {
      // Check if user has admin role
      if (payload.role !== "admin") {
        const homeUrl = new URL("/", request.url);
        return NextResponse.redirect(homeUrl);
      }
    }

    // Token is valid, allow access
    return NextResponse.next();
  } catch (error) {
    console.error("Token verification failed:", error);
    // If token is invalid, redirect to login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}; 
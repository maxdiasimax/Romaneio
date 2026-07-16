import { withAuth } from 'next-auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

export const middleware = withAuth(
  function middleware(request: NextRequest & { nextauth: any }) {
    const token = request.nextauth?.token;

    // Protect /app routes
    if (request.nextUrl.pathname.startsWith('/app')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }

    // Protect /admin routes - only admins
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (!token || token.role !== 'admin') {
        return NextResponse.redirect(new URL('/app/dashboard', request.url));
      }
    }

    // Redirect authenticated users away from auth pages
    if (
      (request.nextUrl.pathname.startsWith('/auth/login') ||
        request.nextUrl.pathname.startsWith('/auth/register')) &&
      token
    ) {
      return NextResponse.redirect(new URL('/app/dashboard', request.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token || !['admin', 'app'].some((p) => globalThis.location?.pathname.startsWith(p)),
    },
  },
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)',
  ],
};

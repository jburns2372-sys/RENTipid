import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_local_dev_only" });
  const path = request.nextUrl.pathname;

  // Define route prefixes that require protection
  const isDashboardRoute = path.startsWith('/dashboard');
  
  if (isDashboardRoute) {
    if (!token) {
      // Not logged in
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', encodeURI(path));
      return NextResponse.redirect(loginUrl);
    }

    const role = token.role as string;
    
    // Check specific role-based dashboard access
    if (path.startsWith('/dashboard/renter') && role !== 'Renter' && role !== 'Super Admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (path.startsWith('/dashboard/provider') && role !== 'Individual Provider' && role !== 'Super Admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (path.startsWith('/dashboard/business') && role !== 'Business Provider' && role !== 'Super Admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (path.startsWith('/dashboard/admin') && role !== 'Admin' && role !== 'Super Admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (path.startsWith('/dashboard/finance') && role !== 'Finance Admin' && role !== 'Super Admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (path.startsWith('/dashboard/compliance') && role !== 'Compliance Admin' && role !== 'Admin' && role !== 'Super Admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (path.startsWith('/dashboard/super-admin') && role !== 'Super Admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};

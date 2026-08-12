import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import {
  evaluateAccountAccess,
  isPendingAccountPathAllowed,
} from '@/lib/security/account-access-policy';

export default async function proxy(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const token = await getToken({ req: request, secret });
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
    const status = token.status as string;
    const accessDecision = evaluateAccountAccess(role, status);

    if (!accessDecision.allowed) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (accessDecision.onboardingOnly && !isPendingAccountPathAllowed(path)) {
      return NextResponse.redirect(new URL('/dashboard/profile', request.url));
    }
    
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
    if (path.startsWith('/dashboard/admin')) {
      if (role === 'Admin' || role === 'Super Admin') {
        // Allowed
      } else if ((role === 'SOC_ANALYST' || role === 'SOC_SUPERVISOR') && path.startsWith('/dashboard/admin/security')) {
        // Allowed
      } else {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
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

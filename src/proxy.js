import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export default async function proxy(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || 
                     pathname.startsWith('/forgot-password') || 
                     pathname.startsWith('/reset-password');

  const isSetupPage = pathname === '/setup-account';
  const isDashboardPage = pathname.startsWith('/dashboard');
  const isRootPage = pathname === '/';

  // 1. GUEST: Kick to Login
  if (!token) {
    if (isDashboardPage || isSetupPage || isRootPage) {
      const url = new URL('/login', req.url);
      url.searchParams.set('callbackUrl', encodeURI(req.url)); 
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 2. UNAUTHORIZED ROLE: Strictly Block Non-Admins
  // Even 'organisation' role is now blocked from this portal.
  if (token.role !== 'admin') {
    // Redirect to a specific error page or back to login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 3. PENDING SETUP: Jail to Setup Page
  if (token.forcePasswordChange) {
    if (!isSetupPage) {
      return NextResponse.redirect(new URL('/setup-account', req.url));
    }
    return NextResponse.next();
  }

  // 4. VERIFIED ADMIN: Block Auth/Setup Pages
  if (isAuthPage || isSetupPage || isRootPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg)$).*)',
  ],
};
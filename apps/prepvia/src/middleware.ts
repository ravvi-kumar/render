import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './utils/get-session';

export async function middleware(request: NextRequest) {
  const session = await getSession(request);
  console.log('session in middleware', session);

  if (!session) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};

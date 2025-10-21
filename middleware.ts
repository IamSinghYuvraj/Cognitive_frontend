import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  // Intentionally no auth redirects here. Client-side `ProtectedRoute` handles access control
  // to avoid SSR redirect flicker and to align with the streaming chat UX.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
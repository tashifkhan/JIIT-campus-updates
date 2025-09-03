import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const allowedOriginPattern = process.env.ALLOWED_ORIGIN_PATTERN
  ? new RegExp(process.env.ALLOWED_ORIGIN_PATTERN)
  : /^https?:\/\/(.+\.)?tashif\.codes$|^https?:\/\/localhost:\d+$/;

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const origin = request.headers.get('Origin');

  if (request.nextUrl.pathname.startsWith('/api/') && origin && allowedOriginPattern.test(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};

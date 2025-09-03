import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const allowedOriginPattern = process.env.ALLOWED_ORIGIN_PATTERN
  ? new RegExp(process.env.ALLOWED_ORIGIN_PATTERN)
  : /^https?:\/\/(.+\.)?tashif\.codes(:\d+)?$|^https?:\/\/(.+\.)?vercel\.app(:\d+)?$|^https?:\/\/localhost(:\d+)?$/;

export function middleware(request: NextRequest) {
  const origin = request.headers.get('Origin');
  const pathname = request.nextUrl.pathname;

  // 1. --- Handle OPTIONS (Preflight) requests immediately ---
  if (request.method === 'OPTIONS') {
    const preflightResponse = new NextResponse(null, { status: 204 }); // 204 No Content

    // Only set CORS headers if the origin is explicitly allowed
    if (origin && allowedOriginPattern.test(origin)) {
      preflightResponse.headers.set('Access-Control-Allow-Origin', origin);
      preflightResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      // Reflect 'Access-Control-Request-Headers' to 'Access-Control-Allow-Headers'
      preflightResponse.headers.set('Access-Control-Allow-Headers', request.headers.get('Access-Control-Request-Headers') || 'Content-Type, Authorization');
      preflightResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      preflightResponse.headers.set('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
      preflightResponse.headers.set('Vary', 'Origin, Access-Control-Request-Headers');
      console.log(`[Middleware] Allowed OPTIONS preflight from: ${origin}`);
    } else {
      console.warn(`[Middleware] Blocked OPTIONS preflight from unauthorized origin: ${origin || 'No Origin Header'}`);
      // If origin is not allowed, do not set ACAO. Browser will block.
      // Returning 204 is still appropriate here, but without ACAO.
    }
    return preflightResponse; // Terminate the request chain for OPTIONS
  }

  // 2. --- For actual requests (GET, POST, PUT, DELETE, etc.) ---

  // Check if it's an API route that needs origin enforcement
  if (pathname.startsWith('/api/')) {
    // Crucial Blocking Logic: If no origin, or origin not allowed
    if (!origin || !allowedOriginPattern.test(origin)) {
      console.warn(`[Middleware] Blocked ${request.method} request to ${pathname} from unauthorized origin: ${origin || 'No Origin Header'}. Returning 403.`);
      return new NextResponse(JSON.stringify({ message: 'Forbidden' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // If we reach here, the origin is present and allowed.
    // Create a response that will proceed to the API route, and add necessary headers.
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true'); // If your API uses credentials
    response.headers.set('Vary', 'Origin'); // Important for caching proxies

    console.log(`[Middleware] Allowed ${request.method} request to ${pathname} from allowed origin: ${origin}`);
    return response; // Allow to proceed to the API route handler
  }

  // If the request is not for an /api/ path, let it pass through unmodified
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
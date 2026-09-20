import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { GATE_COOKIE, gateSecret, isGateEnabled } from '@/lib/server/gate';
import { verifySessionToken } from '@/lib/server/session';

const allowedOriginPattern = process.env.ALLOWED_ORIGIN_PATTERN
  ? new RegExp(process.env.ALLOWED_ORIGIN_PATTERN)
  // https only: credentials are allowed cross-origin, so plaintext origins
  // must never be reflected into Access-Control-Allow-Origin.
  : /^https:\/\/(.+\.)?tashif\.codes$|^https?:\/\/localhost:\d+$/;

/**
 * Data APIs sit behind the same "site unavailable" wall as the pages. Without
 * this, the wall is pure client-side theatre and every endpoint can be scraped
 * anonymously. Admin APIs use their own auth and are exempt; policies are
 * public by design; /api/gate mints the cookie itself.
 */
const GATED_API_PREFIXES = [
  '/api/notices',
  '/api/jobs',
  '/api/placement-offers',
  '/api/official-placements',
  '/api/stats',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('Origin');

  if (origin && allowedOriginPattern.test(origin)) {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    const response = await continueWithGateCheck(request, pathname);
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      response.headers.set(key, value);
    }
    return response;
  }

  return continueWithGateCheck(request, pathname);
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

async function continueWithGateCheck(
  request: NextRequest,
  pathname: string,
): Promise<NextResponse> {
  if (!isGateEnabled()) return NextResponse.next();

  const isGated = GATED_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isGated) return NextResponse.next();

  const token = request.cookies.get(GATE_COOKIE)?.value;
  const unlocked = await verifySessionToken(token, 'gate', gateSecret());
  if (!unlocked) {
    return NextResponse.json(
      { ok: false, error: 'Service unavailable' },
      { status: 401, headers: { 'cache-control': 'no-store' } },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};

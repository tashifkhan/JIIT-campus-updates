import { NextResponse } from "next/server";
import { cookies } from "next/headers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = body;
    const adminPass = process.env.ADMIN_PASS;
    if (!adminPass) {
       console.error("ADMIN_PASS is not set in environment variables.");
       return NextResponse.json({ ok: false, error: "Server configuration error" }, { status: 500 });
    }
    if (password === adminPass) {
      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set("admin_token", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

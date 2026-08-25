import { NextResponse } from "next/server";
import { requireAuthenticatedUser, getValidSessionIdentity } from "@/lib/security/authorization";
import { MfaService } from "@/lib/security/auth/mfa-service";
import { MfaRateLimiter } from "@/lib/security/auth/mfa-rate-limiter";
import { grantCurrentSessionAal2 } from "@/lib/security/auth/mfa-session-assurance";

export async function POST(req: Request) {
  try {
    const sessionUser = await requireAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = getValidSessionIdentity({ user: sessionUser });
    const allowed = await MfaRateLimiter.consume(userId, "activation");
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many MFA requests" },
        {
          status: 429,
          headers: { "Retry-After": String(MfaRateLimiter.retryAfterSeconds("activation")) }
        }
      );
    }

    const { token } = await req.json();
    if (!token || typeof token !== "string" || token.length !== 6) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
    }

    const { recoveryCodes } = await MfaService.activateMfa(userId, token);
    const assuranceGranted = await grantCurrentSessionAal2();
    if (!assuranceGranted) {
      return NextResponse.json({ error: "Session assurance unavailable" }, { status: 401 });
    }

    const res = NextResponse.json({ recoveryCodes });
    res.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return res;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Activation failed" }, { status: 400 });
  }
}

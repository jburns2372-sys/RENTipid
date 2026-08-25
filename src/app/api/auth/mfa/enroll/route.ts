import { NextResponse } from "next/server";
import { requireAuthenticatedUser, getValidSessionIdentity } from "@/lib/security/authorization";
import { MfaService } from "@/lib/security/auth/mfa-service";
import { MfaRateLimiter } from "@/lib/security/auth/mfa-rate-limiter";

export async function POST() {
  try {
    const sessionUser = await requireAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = getValidSessionIdentity({ user: sessionUser });
    const userEmail = sessionUser.email || "";

    const allowed = await MfaRateLimiter.consume(userId, "enrollment");
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many MFA requests" },
        {
          status: 429,
          headers: { "Retry-After": String(MfaRateLimiter.retryAfterSeconds("enrollment")) }
        }
      );
    }

    const { secret } = await MfaService.generateEnrollment(userId, userEmail);

    const res = NextResponse.json({ secret });
    res.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return res;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Enrollment failed" }, { status: 400 });
  }
}

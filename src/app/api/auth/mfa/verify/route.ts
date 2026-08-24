import { NextResponse } from "next/server";
import { requireAuthenticatedUser, getValidSessionIdentity } from "@/lib/security/authorization";
import { MfaService } from "@/lib/security/auth/mfa-service";

export async function POST(req: Request) {
  try {
    const sessionUser = await requireAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const userId = getValidSessionIdentity({ user: sessionUser });

    let isValid = false;
    if (token.length === 12) {
      // Recovery code (6 hex bytes = 12 chars)
      isValid = await MfaService.verifyRecoveryCode(userId, token);
    } else {
      // Standard TOTP
      isValid = await MfaService.verifyMfa(userId, token);
    }

    if (isValid) {
      const res = NextResponse.json({ success: true });
      res.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
      return res;
    } else {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Verification failed" }, { status: 400 });
  }
}

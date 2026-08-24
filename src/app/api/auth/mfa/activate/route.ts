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
    if (!token || typeof token !== "string" || token.length !== 6) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
    }

    const userId = getValidSessionIdentity({ user: sessionUser });

    const { recoveryCodes } = await MfaService.activateMfa(userId, token);

    const res = NextResponse.json({ recoveryCodes });
    res.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return res;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Activation failed" }, { status: 400 });
  }
}

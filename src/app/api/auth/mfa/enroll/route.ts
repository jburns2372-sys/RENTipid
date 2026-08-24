import { NextResponse } from "next/server";
import { requireAuthenticatedUser, getValidSessionIdentity } from "@/lib/security/authorization";
import { MfaService } from "@/lib/security/auth/mfa-service";

export async function POST() {
  try {
    const sessionUser = await requireAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = getValidSessionIdentity({ user: sessionUser });
    const userEmail = sessionUser.email || "";

    const { secret } = await MfaService.generateEnrollment(userId, userEmail);

    const res = NextResponse.json({ secret });
    res.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return res;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Enrollment failed" }, { status: 400 });
  }
}

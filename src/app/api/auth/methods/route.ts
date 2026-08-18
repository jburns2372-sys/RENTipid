import { NextResponse } from "next/server";
import { authConfig } from "@/lib/config/auth-config";

export async function GET() {
  return NextResponse.json({
    providers: authConfig.providers,
    policies: {
      otpMaxAttempts: authConfig.policies.otpMaxAttempts,
      otpRateLimitSeconds: authConfig.policies.otpRateLimitSeconds,
    }
  });
}

import { NextResponse } from "next/server";
import { insuranceErrorResponse } from "@/lib/insurance/transaction/http";
import { createInsuranceTransactionRuntime } from "@/lib/insurance/transaction/runtime";

export async function POST(
  request: Request,
  context: { params: Promise<{ partner: string }> },
) {
  try {
    const { partner } = await context.params;
    const headers: Record<string, string> = {};
    request.headers.forEach((value, name) => {
      headers[name.toLowerCase()] = value;
    });
    const result = await createInsuranceTransactionRuntime().processWebhook({
      partnerKey: partner.trim().toLowerCase(),
      headers,
      body: await request.json(),
      receivedAt: new Date(),
    });
    const status = result.status === "REJECTED" ? 401 : 200;
    return NextResponse.json(result, { status });
  } catch (error) {
    return insuranceErrorResponse(error);
  }
}

import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  insuranceErrorResponse,
  requiredString,
} from "@/lib/insurance/transaction/http";
import { createInsuranceTransactionRuntime } from "@/lib/insurance/transaction/runtime";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string } | undefined;
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const result = await createInsuranceTransactionRuntime().requestIssuance(
      id,
      user.id,
      requiredString(body.requestId, "requestId"),
    );
    return NextResponse.json(result);
  } catch (error) {
    return insuranceErrorResponse(error);
  }
}

import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  insuranceErrorResponse,
  requiredString,
} from "@/lib/insurance/transaction/http";
import { createInsuranceTransactionRuntime } from "@/lib/insurance/transaction/runtime";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string } | undefined;
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const order = await createInsuranceTransactionRuntime().createOrder(
      requiredString(body.selectionId, "selectionId"),
      user.id,
      requiredString(body.requestId, "requestId"),
    );
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return insuranceErrorResponse(error);
  }
}

import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toInsuranceEligibilityContext } from "@/lib/insurance/transaction/booking-context";
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
    const bookingId = requiredString(body.bookingId, "bookingId");
    const requestId = requiredString(body.requestId, "requestId");
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: { include: { category: true } } },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.renter_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const result = await createInsuranceTransactionRuntime().prepareCheckout(
      toInsuranceEligibilityContext(booking, requestId),
    );
    return NextResponse.json(result);
  } catch (error) {
    return insuranceErrorResponse(error);
  }
}

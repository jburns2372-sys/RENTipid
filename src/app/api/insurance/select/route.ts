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
    if (body.consent !== true) {
      return NextResponse.json(
        { error: "Affirmative consent required" },
        { status: 400 },
      );
    }
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
    const premiumMinor = Number(body.premiumMinor);
    if (!Number.isSafeInteger(premiumMinor) || premiumMinor < 0) {
      return NextResponse.json({ error: "Invalid premium" }, { status: 400 });
    }
    const selection = await createInsuranceTransactionRuntime().selectOffer({
      requestId,
      userId: user.id,
      bookingId,
      eligibilityContext: toInsuranceEligibilityContext(booking, requestId),
      offerId: requiredString(body.offerId, "offerId"),
      consent: {
        accepted: true,
        disclosureVersion: requiredString(
          body.disclosureVersion,
          "disclosureVersion",
        ),
        consentedAt: new Date(),
        premiumPresentedMinor: premiumMinor,
        currency: requiredString(body.currency, "currency"),
      },
    });
    return NextResponse.json({ selection }, { status: 201 });
  } catch (error) {
    return insuranceErrorResponse(error);
  }
}

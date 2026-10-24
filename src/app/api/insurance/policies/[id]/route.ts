import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const policy = await prisma.insurancePolicy.findUnique({
    where: { id },
    include: {
      product: { select: { product_code: true } },
      booking: { select: { renter_id: true, provider_id: true } },
    },
  });
  if (!policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }
  const privileged = ["Admin", "Compliance Admin", "Finance Admin", "Super Admin"];
  if (
    policy.booking.renter_id !== user.id &&
    policy.booking.provider_id !== user.id &&
    !privileged.includes(user.role ?? "")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({
    policy: {
      id: policy.id,
      bookingId: policy.booking_id,
      productCode: policy.product.product_code,
      status: policy.status,
      currency: policy.currency,
      premiumMinor: Math.round(Number(policy.premium_amount) * 100),
      coverageStart: policy.coverage_start,
      coverageEnd: policy.coverage_end,
      issuedAt: policy.issued_at,
      cancelledAt: policy.cancelled_at,
    },
  });
}

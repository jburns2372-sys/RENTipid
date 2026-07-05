const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const latestBooking = await prisma.booking.findFirst({
    orderBy: { created_at: 'desc' }
  });

  if (!latestBooking) {
    console.log("No booking found.");
    return;
  }

  // Update booking to Approved and Pending Payment
  await prisma.booking.update({
    where: { id: latestBooking.id },
    data: {
      status: 'Approved',
      payment_status: 'Pending Payment'
    }
  });

  // Create Rental Agreement if not exists
  const existingAgreement = await prisma.rentalAgreement.findUnique({
    where: { booking_id: latestBooking.id }
  });

  if (!existingAgreement) {
    await prisma.rentalAgreement.create({
      data: {
        booking_id: latestBooking.id,
        agreement_text: "STANDARD RENTAL AGREEMENT\n\n1. Renter agrees to return item on time.\n2. Provider confirms item is in working condition.",
        accepted_by_provider: true,
        provider_accepted_at: new Date(),
        accepted_by_renter: true,
        accepted_at: new Date()
      }
    });
  } else {
    await prisma.rentalAgreement.update({
      where: { booking_id: latestBooking.id },
      data: {
        accepted_by_provider: true,
        provider_accepted_at: new Date(),
        accepted_by_renter: true,
        accepted_at: new Date()
      }
    });
  }

  // Log status history
  await prisma.bookingStatusHistory.create({
    data: {
      booking_id: latestBooking.id,
      old_status: 'Pending Provider Approval',
      new_status: 'Approved',
      changed_by: latestBooking.provider_id,
      notes: 'Auto-approved via Phase 19B-B helper script'
    }
  });

  console.log(`Successfully advanced booking ${latestBooking.id} to Pending Payment with signed agreements!`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

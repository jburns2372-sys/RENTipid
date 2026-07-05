const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const latestBooking = await prisma.booking.findFirst({
    orderBy: { created_at: 'desc' },
    include: { listing: true }
  });

  if (!latestBooking) {
    console.log("No booking found.");
    return;
  }

  const settings = [
    { key: 'PAYMENT_LIVE_PILOT_ENABLED', value: 'true' },
    { key: 'PAYMENT_EMERGENCY_FREEZE', value: 'false' }, // TURN OFF FREEZE
    { key: 'PILOT_RENTER_ID', value: latestBooking.renter_id },
    { key: 'PILOT_PROVIDER_ID', value: latestBooking.provider_id },
    { key: 'PILOT_LISTING_ID', value: latestBooking.listing_id },
    { key: 'PILOT_MAX_AMOUNT', value: '5000' }
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { setting_key: setting.key },
      update: { setting_value: setting.value },
      create: { setting_key: setting.key, setting_value: setting.value }
    });
  }

  console.log(`Successfully configured Live Pilot Guardrails for Booking ${latestBooking.id}!`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

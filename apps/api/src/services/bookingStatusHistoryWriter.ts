import { Prisma } from '@prisma/client';

export const recordBookingCreatedHistory = async (
  tx: Prisma.TransactionClient,
  bookingId: string,
  actorId: string,
  newStatus: string
) => {
  return await tx.bookingStatusHistory.create({
    data: {
      booking_id: bookingId,
      old_status: 'SYSTEM_CREATION',
      new_status: newStatus,
      changed_by: actorId,
      notes: 'Initial booking creation'
    }
  });
};

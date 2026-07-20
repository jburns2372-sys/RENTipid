import { PrismaClient } from '@prisma/client';
import { recordBookingCreatedHistory } from './bookingStatusHistoryWriter';
const prisma = new PrismaClient();

export const createBookingHold = async (
  renterId: string,
  listingId: string,
  startDate: Date,
  endDate: Date,
  quantity: number
) => {
  // Phase 6: Atomic Transaction with Concurrency Control
  return await prisma.$transaction(async (tx) => {
    // 1. Validate Listing Status and fetch exact pricing directly from DB
    const listing = await tx.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing || listing.status !== 'Published') {
      throw new Error('Listing is not available');
    }

    // 2. Concurrency Lock: Query existing bookings for overlapping dates
    // For true concurrency under heavy load in Postgres, we would use raw queries with row-level locks.
    // For standard Prisma flow, we verify existing reservations.
    const overlappingBookings = await tx.booking.findMany({
      where: {
        listing_id: listingId,
        status: { in: ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'ACTIVE'] },
        AND: [
          { start_date: { lte: endDate } },
          { end_date: { gte: startDate } }
        ]
      }
    });

    if (overlappingBookings.length > 0) {
      throw new Error('Listing is already booked for these dates');
    }

    // 3. Server-side Calculation (Never trust client payload amounts)
    // Simplified calculation for demonstration
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const basePrice = listing.daily_rate * days * quantity;
    const deposit = listing.security_deposit || 0;
    const totalAmount = basePrice + deposit;

    // 4. Create the booking atomically with 'PENDING_PAYMENT' hold state
    const holdExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes hold

    const booking = await tx.booking.create({
      data: {
        renter: { connect: { id: renterId } },
        listing: { connect: { id: listingId } },
        provider: { connect: { id: listing.provider_id } },
        start_date: startDate,
        end_date: endDate,
        status: 'PENDING_PAYMENT',
        deposit_amount: deposit,
        rental_duration: days,
        rental_duration_unit: 'DAYS',
        selected_rate_type: 'DAILY',
        base_rental_amount: basePrice,
        estimated_total_amount: totalAmount,
        pickup_option: 'Pickup'
      }
    });

    // 5. Audit Log (omitted for brevity, but mandatory for Phase 6)
    await recordBookingCreatedHistory(tx, booking.id, renterId, booking.status);

    return booking;
  });
};
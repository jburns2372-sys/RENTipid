import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkListingAvailability(listingId: string, startDate: Date, endDate: Date, quantityRequested: number = 1): Promise<{ available: boolean, reason?: string }> {
  // Basic date validation
  if (startDate > endDate) {
    return { available: false, reason: 'Start date cannot be after end date' };
  }
  
  const now = new Date();
  // Strip time for past date check
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  if (startDay < today) {
    return { available: false, reason: 'Start date cannot be in the past' };
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    return { available: false, reason: 'Listing not found' };
  }

  if (listing.status !== 'Published') {
    return { available: false, reason: 'Listing is not published' };
  }

  // Check listing global availability window
  if (listing.availability_start && startDate < listing.availability_start) {
    return { available: false, reason: `Listing is only available from ${listing.availability_start.toLocaleDateString()}` };
  }
  if (listing.availability_end && endDate > listing.availability_end) {
    return { available: false, reason: `Listing is only available until ${listing.availability_end.toLocaleDateString()}` };
  }

  // Find overlapping active bookings
  // Active bookings are those that block availability: Approved, Pending Payment, Confirmed, Ongoing, Returned
  // We exclude: Cancelled by Renter, Cancelled by Provider, Rejected, Expired, Completed (if it means it's available again, actually Returned/Completed usually implies past, but let's just check overlap of intended dates).
  
  const blockingStatuses = ['Approved', 'Pending Payment', 'Confirmed', 'Ongoing'];
  
  const overlappingBookings = await prisma.booking.findMany({
    where: {
      listing_id: listingId,
      status: { in: blockingStatuses },
      AND: [
        { start_date: { lte: endDate } },
        { end_date: { gte: startDate } }
      ]
    }
  });

  // Calculate consumed quantity. For Phase 4, let's assume each booking takes 1 quantity.
  // If we allowed quantity booking, we'd sum it. But the model doesn't have a quantity field in Booking right now. 
  // Let's assume booking quantity = 1.
  const totalBookedQuantity = overlappingBookings.length;

  if (totalBookedQuantity + quantityRequested > listing.quantity) {
    return { available: false, reason: 'Listing is not available for the selected dates due to other bookings.' };
  }

  return { available: true };
}

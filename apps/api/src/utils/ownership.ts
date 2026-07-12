import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const isListingOwner = async (userId: string, listingId: string): Promise<boolean> => {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { provider_id: true }
  });
  return listing?.provider_id === userId;
};

export const isBookingOwner = async (userId: string, bookingId: string): Promise<boolean> => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { renter_id: true, listing: { select: { provider_id: true } } }
  });
  // Allow access if user is either the Renter or the Provider
  return booking?.renter_id === userId || booking?.listing.provider_id === userId;
};
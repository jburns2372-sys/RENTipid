"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBookingOwner = exports.isListingOwner = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const isListingOwner = async (userId, listingId) => {
    const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { provider_id: true }
    });
    return listing?.provider_id === userId;
};
exports.isListingOwner = isListingOwner;
const isBookingOwner = async (userId, bookingId) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { renter_id: true, listing: { select: { provider_id: true } } }
    });
    // Allow access if user is either the Renter or the Provider
    return booking?.renter_id === userId || booking?.listing.provider_id === userId;
};
exports.isBookingOwner = isBookingOwner;

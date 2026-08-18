import type { InsuranceEligibilityRequest } from "../types";

export interface InsuranceBookingContextSource {
  id: string;
  renter_id: string;
  listing_id: string;
  start_date: Date;
  end_date: Date;
  estimated_total_amount: number;
  listing: {
    category: {
      name: string;
    };
  };
}

export function toInsuranceEligibilityContext(
  booking: InsuranceBookingContextSource,
  requestId: string,
): InsuranceEligibilityRequest {
  return {
    requestId,
    userId: booking.renter_id,
    bookingId: booking.id,
    listingId: booking.listing_id,
    listingCategory: booking.listing.category.name,
    rentalValue: {
      amountMinor: Math.round(booking.estimated_total_amount * 100),
      currency: "PHP",
    },
    rentalStart: booking.start_date,
    rentalEnd: booking.end_date,
  };
}

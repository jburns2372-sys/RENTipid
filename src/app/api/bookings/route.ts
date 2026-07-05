import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { checkListingAvailability } from '@/lib/availability';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const renterId = (session.user as any).id;
    const role = (session.user as any).role;
    const verificationStatus = (session.user as any).status;

    if (role !== 'Renter' && role !== 'Individual Provider' && role !== 'Business Provider' && role !== 'Super Admin') {
      return NextResponse.json({ message: 'Only registered users can book' }, { status: 403 });
    }

    if (verificationStatus !== 'Verified') {
      return NextResponse.json({ message: 'You must be fully verified to request a booking' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      listing_id, 
      start_date, 
      end_date, 
      start_time, 
      end_time, 
      rental_duration,
      rental_duration_unit,
      pickup_option,
      delivery_requested,
      delivery_address,
      renter_notes
    } = body;

    if (!listing_id || !start_date || !end_date || !rental_duration || !rental_duration_unit) {
      return NextResponse.json({ message: 'Missing required booking fields' }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listing_id } });
    if (!listing) {
      return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
    }

    if (listing.provider_id === renterId) {
      return NextResponse.json({ message: 'You cannot book your own listing' }, { status: 400 });
    }

    const sDate = new Date(start_date);
    const eDate = new Date(end_date);

    // Validate availability
    const availability = await checkListingAvailability(listing_id, sDate, eDate, 1);
    if (!availability.available) {
      return NextResponse.json({ message: availability.reason || 'Dates are not available' }, { status: 400 });
    }

    // Compute pricing
    let base_rental_amount = 0;
    let selected_rate_type = '';

    switch (rental_duration_unit) {
      case 'Hourly':
        if (!listing.hourly_rate) return NextResponse.json({ message: 'Hourly rate not available' }, { status: 400 });
        base_rental_amount = listing.hourly_rate * rental_duration;
        selected_rate_type = 'Hourly';
        break;
      case 'Daily':
        if (!listing.daily_rate) return NextResponse.json({ message: 'Daily rate not available' }, { status: 400 });
        base_rental_amount = listing.daily_rate * rental_duration;
        selected_rate_type = 'Daily';
        break;
      case 'Weekly':
        if (!listing.weekly_rate) return NextResponse.json({ message: 'Weekly rate not available' }, { status: 400 });
        base_rental_amount = listing.weekly_rate * rental_duration;
        selected_rate_type = 'Weekly';
        break;
      case 'Monthly':
        if (!listing.monthly_rate) return NextResponse.json({ message: 'Monthly rate not available' }, { status: 400 });
        base_rental_amount = listing.monthly_rate * rental_duration;
        selected_rate_type = 'Monthly';
        break;
      default:
        return NextResponse.json({ message: 'Invalid rental unit' }, { status: 400 });
    }

    const deposit_amount = listing.security_deposit || 0;
    const delivery_fee = delivery_requested ? (listing.delivery_fee || 0) : 0;
    const estimated_total_amount = base_rental_amount + deposit_amount + delivery_fee;

    // Create Booking
    const booking = await prisma.booking.create({
      data: {
        listing_id,
        renter_id: renterId,
        provider_id: listing.provider_id,
        start_date: sDate,
        end_date: eDate,
        start_time,
        end_time,
        rental_duration,
        rental_duration_unit,
        selected_rate_type,
        base_rental_amount,
        deposit_amount,
        estimated_total_amount,
        pickup_option,
        delivery_requested,
        delivery_address,
        delivery_fee,
        renter_notes,
        status: 'Pending Provider Approval',
        payment_status: 'Not Required Yet',
      }
    });

    // Create Status History
    await prisma.bookingStatusHistory.create({
      data: {
        booking_id: booking.id,
        old_status: 'None',
        new_status: 'Pending Provider Approval',
        changed_by: renterId,
        notes: 'Booking requested by renter'
      }
    });

    // Create Audit Log
    await createAuditLog({
      actor_user_id: renterId,
      action: 'BOOKING_REQUEST_CREATED',
      module: 'Booking',
      target_id: booking.id,
      details: `Requested listing ${listing_id}`
    });

    // Notify Provider
    await prisma.notification.create({
      data: {
        user_id: listing.provider_id,
        title: 'New Booking Request',
        message: `You have a new booking request for ${listing.title}.`,
        type: 'Booking Request'
      }
    });

    return NextResponse.json({ message: 'Booking requested successfully', booking_id: booking.id }, { status: 201 });

  } catch (error) {
    console.error('Booking request error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

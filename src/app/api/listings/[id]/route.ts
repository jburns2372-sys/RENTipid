import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const isAdmin = role === 'Admin' || role === 'Compliance Admin' || role === 'Super Admin';
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        category: true,
        photos: { orderBy: { display_order: 'asc' } },
        documents: { orderBy: { uploaded_at: 'desc' } },
      },
    });

    if (!listing) {
      return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
    }

    if (!isAdmin && listing.provider_id !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(listing, { status: 200 });
  } catch (error) {
    console.error('Fetch listing error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const providerId = (session.user as any).id;
    const { id } = await params;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
    }

    if (listing.provider_id !== providerId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (!['Draft', 'Rejected'].includes(listing.status)) {
      return NextResponse.json({ message: 'Cannot edit a listing that has already been submitted or published' }, { status: 400 });
    }

    const body = await req.json();

    const parseNumber = (val: any) => (val !== undefined && val !== null && val !== '') ? parseFloat(val) : null;
    const parseIntSafe = (val: any) => (val !== undefined && val !== null && val !== '') ? parseInt(val, 10) : null;

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.category_id !== undefined && { category_id: body.category_id }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.province !== undefined && { province: body.province }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.rental_type !== undefined && { rental_type: body.rental_type }),
        ...(body.daily_rate !== undefined && { daily_rate: parseNumber(body.daily_rate) }),
        ...(body.hourly_rate !== undefined && { hourly_rate: parseNumber(body.hourly_rate) }),
        ...(body.weekly_rate !== undefined && { weekly_rate: parseNumber(body.weekly_rate) }),
        ...(body.monthly_rate !== undefined && { monthly_rate: parseNumber(body.monthly_rate) }),
        ...(body.security_deposit !== undefined && { security_deposit: parseNumber(body.security_deposit) }),
        ...(body.replacement_value !== undefined && { replacement_value: parseNumber(body.replacement_value) }),
        ...(body.quantity !== undefined && { quantity: parseIntSafe(body.quantity) || 1 }),
        ...(body.condition !== undefined && { condition: body.condition }),
        ...(body.pickup_available !== undefined && { pickup_available: Boolean(body.pickup_available) }),
        ...(body.delivery_available !== undefined && { delivery_available: Boolean(body.delivery_available) }),
        ...(body.delivery_fee !== undefined && { delivery_fee: parseNumber(body.delivery_fee) }),
        ...(body.min_duration !== undefined && { min_duration: parseIntSafe(body.min_duration) }),
        ...(body.max_duration !== undefined && { max_duration: parseIntSafe(body.max_duration) }),
        ...(body.rules !== undefined && { rules: body.rules }),
        ...(body.damage_policy !== undefined && { damage_policy: body.damage_policy }),
      },
    });

    await createAuditLog({
      actor_user_id: providerId,
      action: 'LISTING_DRAFT_UPDATED',
      module: 'Listings',
      target_id: id,
      details: `Updated listing draft: ${updated.title}`,
    });

    return NextResponse.json({ message: 'Listing updated successfully', listing: updated }, { status: 200 });
  } catch (error) {
    console.error('Update listing error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

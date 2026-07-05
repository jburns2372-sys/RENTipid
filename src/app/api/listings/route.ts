import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const providerId = (session.user as any).id;
    const role = (session.user as any).role;
    const status = (session.user as any).status;

    if (role !== 'Individual Provider' && role !== 'Business Provider') {
      return NextResponse.json({ message: 'Only providers can create listings' }, { status: 403 });
    }

    if (status !== 'Verified') {
      return NextResponse.json({ message: 'You must be verified to create a listing' }, { status: 403 });
    }

    const body = await req.json();
    
    // Parse floats safely
    const parseNumber = (val: any) => val ? parseFloat(val) : null;
    const parseIntSafe = (val: any) => val ? parseInt(val, 10) : null;

    const listing = await prisma.listing.create({
      data: {
        provider_id: providerId,
        category_id: body.category_id,
        title: body.title,
        description: body.description,
        location: body.location,
        city: body.city,
        province: body.province,
        country: body.country,
        rental_type: body.rental_type,
        hourly_rate: parseNumber(body.hourly_rate),
        daily_rate: parseNumber(body.daily_rate),
        weekly_rate: parseNumber(body.weekly_rate),
        monthly_rate: parseNumber(body.monthly_rate),
        security_deposit: parseNumber(body.security_deposit),
        replacement_value: parseNumber(body.replacement_value),
        quantity: parseIntSafe(body.quantity) || 1,
        condition: body.condition,
        pickup_available: body.pickup_available,
        delivery_available: body.delivery_available,
        delivery_fee: parseNumber(body.delivery_fee),
        min_duration: parseIntSafe(body.min_duration),
        max_duration: parseIntSafe(body.max_duration),
        late_penalty: body.late_penalty,
        damage_policy: body.damage_policy,
        rules: body.rules,
        status: 'Draft' // Always start as Draft
      }
    });

    await createAuditLog({
      actor_user_id: providerId,
      action: 'LISTING_DRAFT_CREATED',
      module: 'Listings',
      target_id: listing.id,
      details: `Created draft: ${listing.title}`
    });

    return NextResponse.json({ message: 'Listing created successfully', id: listing.id }, { status: 201 });

  } catch (error) {
    console.error('Listing creation error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // We can fetch published listings here later for the public page
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'Published';
  
  try {
    const listings = await prisma.listing.findMany({
      where: { status },
      include: { category: true, photos: { where: { is_cover: true } } },
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json(listings, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

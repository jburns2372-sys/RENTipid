import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: bookingId } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking || booking.provider_id !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const claimType = formData.get('claim_type') as string;
    const requestedDeduction = parseFloat(formData.get('requested_deduction_amount') as string);
    const description = formData.get('claim_description') as string;

    if (!claimType || isNaN(requestedDeduction) || !description) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (requestedDeduction > booking.deposit_amount) {
      return NextResponse.json({ message: 'Requested deduction cannot exceed the total security deposit.' }, { status: 400 });
    }

    const claimNumber = `CLM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Execute in transaction
    const claim = await prisma.$transaction(async (tx) => {
      
      const newClaim = await tx.damageClaim.create({
        data: {
          booking_id: bookingId,
          listing_id: booking.listing_id,
          renter_id: booking.renter_id,
          provider_id: booking.provider_id,
          claim_number: claimNumber,
          claim_type: claimType,
          claim_status: 'Submitted',
          claim_description: description,
          claimed_amount: requestedDeduction,
          deposit_amount: booking.deposit_amount,
          requested_deduction_amount: requestedDeduction
        }
      });

      // Change Booking status to Disputed
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'Disputed' }
      });

      await tx.bookingStatusHistory.create({
        data: {
          booking_id: bookingId,
          old_status: booking.status,
          new_status: 'Disputed',
          changed_by: userId,
          notes: `Provider filed a Damage Claim (${claimNumber}).`
        }
      });

      // Create Deposit Hold Action
      await tx.depositAction.create({
        data: {
          booking_id: bookingId,
          action_type: 'Hold for Dispute',
          amount: booking.deposit_amount,
          reason: `Deposit held pending resolution of Claim ${claimNumber}`,
          performed_by: 'SYSTEM'
        }
      });

      return newClaim;
    });

    // Handle Evidence Uploads
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'claims');
    await mkdir(uploadDir, { recursive: true });

    for (let i = 1; i <= 3; i++) {
      const file = formData.get(`photo_${i}`) as File | null;
      const caption = formData.get(`caption_${i}`) as string || '';

      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${claim.id}-evidence-${i}-${Date.now()}.jpg`;
        const filePath = join(uploadDir, filename);
        
        await writeFile(filePath, buffer);
        
        await prisma.damageClaimPhoto.create({
          data: {
            damage_claim_id: claim.id,
            file_path: `/uploads/claims/${filename}`,
            file_type: file.type,
            file_size: file.size,
            caption: caption,
            uploaded_by: userId
          }
        });
      }
    }

    // Notify Renter
    await prisma.notification.create({
      data: {
        user_id: booking.renter_id,
        title: 'Damage Claim Filed',
        message: `Provider filed a damage claim (${claimNumber}) against your deposit. Please review and respond.`,
        type: 'Claim'
      }
    });

    await createAuditLog({
      actor_user_id: userId,
      action: 'DAMAGE_CLAIM_CREATED',
      module: 'DamageClaim',
      target_id: claim.id,
      details: `Claim ${claimNumber} created for booking ${bookingId}`
    });

    return NextResponse.json({ message: 'Claim submitted successfully', claimId: claim.id }, { status: 200 });

  } catch (error) {
    console.error('Claim API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

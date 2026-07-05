import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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

    if (booking.status !== 'Confirmed' && booking.status !== 'Ongoing' && booking.status !== 'Returned') {
      return NextResponse.json({ message: 'Invalid booking status for inspection' }, { status: 400 });
    }

    const formData = await req.formData();
    const type = formData.get('type') as string; // "Pre-Rental" or "Post-Rental"
    const conditionSummary = formData.get('condition_summary') as string;
    const odometer = formData.get('odometer_reading') as string || null;
    const fuel = formData.get('fuel_level') as string || null;
    const accessories = formData.get('accessories_checked') as string || null;
    const notes = formData.get('provider_notes') as string || null;

    if (!conditionSummary) {
      return NextResponse.json({ message: 'Condition summary is required' }, { status: 400 });
    }

    // Check if an inspection of this type already exists
    const existing = await prisma.inspectionReport.findFirst({
      where: { booking_id: bookingId, inspection_type: type }
    });

    if (existing) {
      return NextResponse.json({ message: `${type} inspection already exists` }, { status: 400 });
    }

    // Create Report
    const report = await prisma.inspectionReport.create({
      data: {
        booking_id: bookingId,
        listing_id: booking.listing_id,
        renter_id: booking.renter_id,
        provider_id: booking.provider_id,
        inspection_type: type,
        status: 'Submitted by Provider',
        condition_summary: conditionSummary,
        odometer_reading: odometer,
        fuel_level: fuel,
        accessories_checked: accessories,
        provider_notes: notes,
        submitted_by: userId,
        submitted_at: new Date()
      }
    });

    // Handle File Uploads
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'inspections');
    await mkdir(uploadDir, { recursive: true });

    const photoEntries = Array.from(formData.entries()).filter(([key]) => key.startsWith('photo_'));

    for (const [key, val] of photoEntries) {
      const file = val as File;
      if (file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${bookingId}-${type.replace('-', '')}-${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        const filePath = join(uploadDir, filename);
        
        await writeFile(filePath, buffer);
        
        // Extract category from key (e.g., photo_front -> Front View)
        const categoryMap: Record<string, string> = {
          'photo_front': 'Front View',
          'photo_back': 'Back View',
          'photo_left': 'Left Side',
          'photo_right': 'Right Side',
          'photo_damage': 'Existing Damage',
          'photo_meter': 'Meter/Odometer',
          'photo_return': 'Return Condition',
          'photo_other': 'Other'
        };
        const photoCategory = categoryMap[key] || 'Other';

        await prisma.inspectionPhoto.create({
          data: {
            inspection_report_id: report.id,
            booking_id: bookingId,
            file_path: `/uploads/inspections/${filename}`,
            file_type: file.type,
            file_size: file.size,
            photo_category: photoCategory,
            uploaded_by: userId
          }
        });
      }
    }

    // Notification
    await prisma.notification.create({
      data: {
        user_id: booking.renter_id,
        title: `${type} Inspection Submitted`,
        message: `Provider has submitted the ${type} inspection for ${bookingId}. Please review it.`,
        type: 'Inspection'
      }
    });

    await createAuditLog({
      actor_user_id: userId,
      action: 'INSPECTION_SUBMITTED',
      module: 'Inspection',
      target_id: report.id,
      details: `${type} inspection submitted for booking ${bookingId}`
    });

    // If Post-Rental and No Issue, auto-complete
    if (type === 'Post-Rental') {
      const issueFound = formData.get('issue_found') === 'true';
      if (!issueFound) {
        // Auto-complete workflow (Phase 6 logic)
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'Completed', completed_at: new Date() }
        });

        await prisma.bookingStatusHistory.create({
          data: {
            booking_id: bookingId,
            old_status: 'Returned',
            new_status: 'Completed',
            changed_by: userId,
            notes: 'Provider reported no issues on return.'
          }
        });

        // Add Deposit Release Pending Action
        if (booking.deposit_amount > 0) {
          await prisma.depositAction.create({
            data: {
              booking_id: bookingId,
              action_type: 'Release Full',
              amount: booking.deposit_amount,
              reason: 'No issues on return. Full deposit release recommended.',
              performed_by: 'SYSTEM'
            }
          });
        }
      }
    }

    return NextResponse.json({ message: 'Inspection saved successfully', reportId: report.id }, { status: 200 });

  } catch (error) {
    console.error('Inspection API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

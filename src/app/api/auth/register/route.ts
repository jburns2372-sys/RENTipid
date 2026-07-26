import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/lib/audit';
import { RegisterInputSchema } from '@/lib/security/identity-input-security';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // 1. Parse JSON safely
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ message: 'Malformed JSON' }, { status: 400 });
    }

    // 2. Validate with the strict schema
    const validationResult = RegisterInputSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ message: 'Invalid registration input' }, { status: 400 });
    }

    // 3. Normalize validated fields
    const validatedData = validationResult.data;

    // Explicit mapping to prevent prototype pollution and arbitrary fields
    const email = validatedData.email;
    const password = validatedData.password;
    const full_name = validatedData.full_name;
    const mobile_number = validatedData.mobile_number || null;
    const account_type = validatedData.account_type;
    const role = validatedData.role;
    const address = validatedData.address || null;
    const city = validatedData.city || null;
    const province = validatedData.province || null;
    const country = validatedData.country || null;
    const business_name = validatedData.business_name || null;
    const business_registration_number = validatedData.business_registration_number || null;
    const authorized_representative = validatedData.authorized_representative || null;

    // 4. Check duplicate account
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    // 5. Hash the validated password
    const password_hash = await bcrypt.hash(password, 10);

    // 6. Create the user using an explicit Prisma field mapping
    const user = await prisma.user.create({
      data: {
        email,
        full_name,
        mobile_number,
        password_hash,
        account_type,
        role,
        status: 'Pending',
      }
    });

    // 7. Create the applicable profile using explicit validated fields
    if (account_type === 'Business') {
      await prisma.businessProfile.create({
        data: {
          user_id: user.id,
          business_name: business_name || full_name,
          business_registration_number: business_registration_number || '',
          business_address: address || '',
          authorized_representative: authorized_representative || full_name,
          verification_status: 'Pending'
        }
      });
    } else {
      await prisma.userProfile.create({
        data: {
          user_id: user.id,
          address: address || '',
          city: city || '',
          province: province || '',
          country: country || 'Philippines',
          verification_status: 'Pending'
        }
      });
    }

    // 8. Write existing audit logging
    await createAuditLog({
      actor_user_id: user.id,
      action: 'USER_REGISTERED',
      module: 'Authentication',
      target_id: user.id,
      details: `Registered as ${role}`
    });

    // 9. Return the existing sanitized success response
    return NextResponse.json({ message: 'User registered successfully', userId: user.id }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/lib/audit';
import { RegisterInputSchema } from '@/lib/security/identity-input-security';
import { ProfileFieldProtection, ProfileFieldContext } from '@/lib/security/crypto/profile-field-protection';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ message: 'Malformed JSON' }, { status: 400 });
    }

    const validationResult = RegisterInputSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ message: 'Invalid registration input' }, { status: 400 });
    }

    const validatedData = validationResult.data;

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

    let userAddressEncrypted: string | null = null;
    let businessAddressEncrypted: string | null = null;
    let businessRegistrationNumberEncrypted: string | null = null;

    if (address) {
      userAddressEncrypted = ProfileFieldProtection.protect(address, ProfileFieldContext.USER_ADDRESS);
      businessAddressEncrypted = ProfileFieldProtection.protect(address, ProfileFieldContext.BUSINESS_ADDRESS);
    }
    
    if (business_registration_number) {
      businessRegistrationNumberEncrypted = ProfileFieldProtection.protect(business_registration_number, ProfileFieldContext.BUSINESS_REGISTRATION_NUMBER);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);

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

    if (account_type === 'Business') {
      await prisma.businessProfile.create({
        data: {
          user_id: user.id,
          business_name: business_name || full_name,
          business_registration_number: null,
          business_registration_number_encrypted: businessRegistrationNumberEncrypted,
          business_address: null,
          business_address_encrypted: businessAddressEncrypted,
          authorized_representative: authorized_representative || full_name,
          verification_status: 'Pending'
        }
      });
    } else {
      await prisma.userProfile.create({
        data: {
          user_id: user.id,
          address: null,
          address_encrypted: userAddressEncrypted,
          city: city || '',
          province: province || '',
          country: country || 'Philippines',
          verification_status: 'Pending'
        }
      });
    }

    await createAuditLog({
      actor_user_id: user.id,
      action: 'USER_REGISTERED',
      module: 'Authentication',
      target_id: user.id,
      details: 'Registered as ' + role
    });

    return NextResponse.json({ message: 'User registered successfully', userId: user.id }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ message: 'Internal server error during registration' }, { status: 500 });
  }
}

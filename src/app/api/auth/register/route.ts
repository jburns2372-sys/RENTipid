import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      email, 
      password, 
      full_name, 
      mobile_number, 
      account_type, 
      role,
      address,
      city,
      province,
      country,
      business_name,
      business_registration_number,
      authorized_representative
    } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
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
        account_type: account_type || 'Individual',
        role: role || 'Renter',
        status: 'Pending',
      }
    });

    if (account_type === 'Business') {
      await prisma.businessProfile.create({
        data: {
          user_id: user.id,
          business_name: business_name || full_name,
          business_registration_number,
          business_address: address,
          authorized_representative: authorized_representative || full_name,
          verification_status: 'Pending'
        }
      });
    } else {
      await prisma.userProfile.create({
        data: {
          user_id: user.id,
          address,
          city,
          province,
          country,
          verification_status: 'Pending'
        }
      });
    }

    await createAuditLog({
      actor_user_id: user.id,
      action: 'USER_REGISTERED',
      module: 'Authentication',
      target_id: user.id,
      details: `Registered as ${role}`
    });

    return NextResponse.json({ message: 'User registered successfully', userId: user.id }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { generateAndSendOtp } from '@/lib/auth/otp';
import { authConfig } from '@/lib/config/auth-config';

export async function POST(req: Request) {
  try {
    if (!authConfig.providers.otp) {
      return NextResponse.json({ message: 'OTP is disabled' }, { status: 403 });
    }

    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });
    }

    await generateAndSendOtp(phone);
    return NextResponse.json({ message: 'OTP sent' }, { status: 200 });
  } catch (error: any) {
    console.error('OTP error:', error);
    // Return generic error to prevent enumeration or specific leak
    return NextResponse.json({ message: error.message || 'Failed to send OTP' }, { status: 400 });
  }
}

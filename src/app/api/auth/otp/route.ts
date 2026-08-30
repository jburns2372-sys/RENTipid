import { type NextRequest } from 'next/server';
import { handleOtpPost } from '@/lib/auth/unified/otp-route';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return handleOtpPost(request);
}

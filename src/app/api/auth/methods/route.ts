import { NextResponse } from 'next/server';
import { getGatewayMethodStates } from '@/lib/auth/unified/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    methods: getGatewayMethodStates().map((method) => ({
      method: method.method,
      enabled: method.enabled,
      configured: method.configured,
    })),
  });
}

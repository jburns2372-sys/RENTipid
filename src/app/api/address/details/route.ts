import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AddressService } from '@/lib/address/AddressService';
import { AddressRateLimiter } from '@/lib/address/rate-limiter';
import { AddressTokenService } from '@/lib/address/address-token';
import { detailsRequestSchema } from '@/lib/address/types';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as {id?: string})?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session?.user as {id?: string}).id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // ASSUMPTION: The application is deployed behind a single trusted reverse proxy (e.g., Vercel, AWS ALB)
    // that appends the true client IP to the end of the X-Forwarded-For chain.
    // We conservatively parse the last element to prevent attackers from rotating keys via spoofed preceding IPs.
    const xForwardedFor = req.headers.get('x-forwarded-for');
    const ip = xForwardedFor ? xForwardedFor.split(',').pop()!.trim() : (req.headers.get('x-real-ip') || 'unknown');

    const allowed = await AddressRateLimiter.consumeDetails(ip, userId);
    if (!allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const body = await req.json();
    const validatedData = detailsRequestSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json({ error: 'Validation Failed', details: validatedData.error.issues }, { status: 400 });
    }
    const { placeId, sessionToken } = validatedData.data;

    const response = await AddressService.getDetails(placeId, sessionToken);

    if (response.status !== 'SUCCESS' || !response.details) {
      const statusMap: Record<string, number> = {
        'RATE_LIMITED': 429,
        'NO_RESULTS': 404,
        'INVALID_PROVIDER_REQUEST': 400,
        'PROVIDER_CONFIGURATION_MISSING': 500,
        'PROVIDER_UNAVAILABLE': 503
      };
      
      const statusCode = statusMap[response.status] || 500;
      return NextResponse.json({ error: response.status }, { status: statusCode });
    }

    const details = response.details;

    // Generate signed Address Selection Token
    const selectionToken = AddressTokenService.generateToken({ ...details, userId });

    return NextResponse.json({
      ...details,
      selectionToken,
    });
  } catch (err: unknown) {
    const safeError = {
      event: "Address Details Error",
      stage: "ROUTE_HANDLER_CATCH",
      errorType: err instanceof Error ? err.name : typeof err,
      errorCode: 'UNHANDLED_PROVIDER_ERROR'
    };
    console.error(JSON.stringify(safeError));
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

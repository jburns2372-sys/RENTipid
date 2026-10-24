import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AddressService } from '@/lib/address/AddressService';
import { AddressRateLimiter } from '@/lib/address/rate-limiter';
import { autocompleteRequestSchema } from '@/lib/address/types';

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

    const allowed = await AddressRateLimiter.consumeAutocomplete(ip, userId);
    if (!allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const body = await req.json();
    const validatedData = autocompleteRequestSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json({ error: 'Validation Failed', details: validatedData.error.issues }, { status: 400 });
    }
    const { input, countryCode, sessionToken } = validatedData.data;

    // Bounds check
    if (input.length < 3) {
      return NextResponse.json({ suggestions: [] });
    }

    const result = await AddressService.searchAutocomplete(input, countryCode || undefined, sessionToken);

    return NextResponse.json(result);
  } catch {
    console.error('Autocomplete Error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

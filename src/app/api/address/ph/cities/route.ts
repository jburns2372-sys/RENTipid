import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PsgcService } from '@/lib/address/psgc/psgc-service';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as { id?: string })?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;

    const cities = await PsgcService.getCities(search);

    return NextResponse.json({ cities });
  } catch {
    console.error('PSGC Cities API Error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

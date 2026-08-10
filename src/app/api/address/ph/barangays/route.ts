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
    const cityPsgcCode = searchParams.get('cityPsgcCode');

    if (!cityPsgcCode || !/^\d{10}$/.test(cityPsgcCode)) {
      return NextResponse.json(
        { error: 'Invalid cityPsgcCode. Must be a 10-digit PSGC code.' },
        { status: 400 }
      );
    }

    // Validate that the parent is actually a city/municipality
    const isValidCity = await PsgcService.validateCity(cityPsgcCode);
    if (!isValidCity) {
      return NextResponse.json(
        { error: 'City/Municipality not found or inactive.' },
        { status: 404 }
      );
    }

    const barangays = await PsgcService.getBarangaysByCityCode(cityPsgcCode);

    return NextResponse.json({ barangays });
  } catch {
    console.error('PSGC Barangays API Error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

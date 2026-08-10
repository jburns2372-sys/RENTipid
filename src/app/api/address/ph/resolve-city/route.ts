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
    const name = searchParams.get('name');

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'City name must be at least 2 characters.' },
        { status: 400 }
      );
    }

    const resolution = await PsgcService.resolveCityByName(name);

    return NextResponse.json(resolution);
  } catch {
    console.error('PSGC Resolve City API Error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

// DEPRECATED (Phase 19 Migration)
// This monolithic Vercel route has been migrated to the isolated Azure Backend API.
// Please update your frontend fetch calls to use 'src/lib/api-client.ts' (azureFetch).
export async function GET() {
  return NextResponse.json({ error: 'Endpoint migrated to Azure Backend' }, { status: 410 });
}
export async function POST() {
  return NextResponse.json({ error: 'Endpoint migrated to Azure Backend' }, { status: 410 });
}
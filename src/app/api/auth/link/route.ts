import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { provider, providerSubject, providerEmail } = await req.json();

    if (!provider || !providerSubject) {
      return NextResponse.json({ message: 'Missing parameters' }, { status: 400 });
    }

    // Verify target identity doesn't belong to another user
    const existing = await prisma.authIdentity.findUnique({
      where: { provider_provider_subject: { provider, provider_subject: providerSubject } }
    });

    if (existing) {
      await prisma.securityEvent.create({
        data: {
          event_code: "AUTH_LINK_BLOCKED",
          source_type: "SYSTEM_ERROR_LOG",
          source_record_id: "link-api",
          security_domain: "IDENTITY_AND_ACCESS",
          event_category: "Authentication",
          event_classification: "POLICY_VIOLATION",
          severity: "MEDIUM",
          environment: "DEVELOPMENT",
          lifecycle_type: "LIVE",
          target_user_id: (session.user as any).id,
          source_summary: { provider, providerSubject } as any,
          idempotency_key: `link_blocked_${providerSubject}_${Date.now()}`,
          occurred_at: new Date(),
          source_received_at: new Date()
        }
      });
      return NextResponse.json({ message: 'Provider account already linked to another user' }, { status: 400 });
    }

    await prisma.authIdentity.create({
      data: {
        user_id: (session.user as any).id,
        provider,
        provider_subject: providerSubject,
        provider_email: providerEmail || null,
      }
    });

    await prisma.accountLinkEvent.create({
      data: {
        user_id: (session.user as any).id,
        provider,
        provider_subject: providerSubject,
        status: "SUCCESS",
      }
    });

    return NextResponse.json({ message: 'Successfully linked' }, { status: 200 });
  } catch (error) {
    console.error('Link error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

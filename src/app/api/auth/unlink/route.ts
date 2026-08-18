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

    const userId = (session.user as any).id;
    const { provider, providerSubject } = await req.json();

    if (!provider || !providerSubject) {
      return NextResponse.json({ message: 'Missing parameters' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        authIdentities: true,
        emailCredential: true,
        phoneIdentity: true,
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Determine viability
    const hasPassword = !!(user.emailCredential?.password_hash || user.password_hash);
    const hasPhone = !!user.phoneIdentity;
    const authIdentityCount = user.authIdentities.length;

    // Never allow removal of the final viable sign-in/recovery factor
    if (!hasPassword && !hasPhone && authIdentityCount <= 1) {
      await prisma.securityEvent.create({
        data: {
          event_code: "AUTH_UNLINK_BLOCKED",
          source_type: "SYSTEM_ERROR_LOG",
          source_record_id: "unlink-api",
          security_domain: "IDENTITY_AND_ACCESS",
          event_category: "Authentication",
          event_classification: "POLICY_VIOLATION",
          severity: "MEDIUM",
          environment: "DEVELOPMENT",
          lifecycle_type: "LIVE",
          target_user_id: userId,
          source_summary: { provider, providerSubject, reason: "Last factor" } as any,
          idempotency_key: `unlink_blocked_${userId}_${Date.now()}`,
          occurred_at: new Date(),
          source_received_at: new Date()
        }
      });
      return NextResponse.json({ message: 'Cannot remove the last authentication method' }, { status: 400 });
    }

    await prisma.authIdentity.delete({
      where: {
        provider_provider_subject: {
          provider,
          provider_subject: providerSubject
        }
      }
    });

    await prisma.accountLinkEvent.create({
      data: {
        user_id: userId,
        provider,
        provider_subject: providerSubject,
        status: "UNLINKED",
      }
    });

    await prisma.securityEvent.create({
      data: {
        event_code: "AUTH_UNLINK_SUCCESS",
        source_type: "SYSTEM_ERROR_LOG",
        source_record_id: "unlink-api",
        security_domain: "IDENTITY_AND_ACCESS",
        event_category: "Authentication",
        event_classification: "POLICY_VIOLATION",
        severity: "LOW",
        environment: "DEVELOPMENT",
        lifecycle_type: "LIVE",
        target_user_id: userId,
        source_summary: { provider, providerSubject } as any,
        idempotency_key: `unlink_success_${userId}_${Date.now()}`,
        occurred_at: new Date(),
        source_received_at: new Date()
      }
    });

    return NextResponse.json({ message: 'Successfully unlinked' }, { status: 200 });
  } catch (error) {
    console.error('Unlink error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

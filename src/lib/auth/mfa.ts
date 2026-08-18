import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { authConfig } from '@/lib/config/auth-config';

const prisma = new PrismaClient();

export async function verifyPrivilegedAccess(req?: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { authorized: false, reason: 'UNAUTHENTICATED' };
  }

  const role = (session.user as any).role;
  const isPrivilegedRole = ['Admin', 'SuperAdmin', 'Finance'].includes(role);

  // If the action or role does not require step-up, proceed
  if (!isPrivilegedRole || !authConfig.policies.privilegedStepUpRequired) {
    return { authorized: true };
  }

  // Find the active session in DB for auth level
  // The token contains sessionId from NextAuth JWT callback
  // However, getServerSession doesn't always expose the token. 
  // Let's assume NextAuth session callback was extended to include sessionId.
  const sessionId = (session as any).sessionId;
  
  if (!sessionId) {
    return { authorized: false, reason: 'NO_SESSION_RECORD' };
  }

  const dbSession = await prisma.authSession.findUnique({
    where: { session_token: sessionId }
  });

  if (!dbSession || dbSession.revoked_at || dbSession.expires_at < new Date()) {
    return { authorized: false, reason: 'SESSION_STALE_OR_REVOKED' };
  }

  // To satisfy MFA, we need MULTIPLE factors or a strong factor.
  // For v1.0, OTP is considered a strong MFA factor if step-up is required. 
  // OAUTH + OTP, or PASSWORD + OTP. 
  // Since our framework currently logs in via one factor, to do step-up, 
  // we would require `dbSession.authentication_level === 'MFA'` or similar.
  // For now, if privileged step-up is required, and they only used PASSWORD, reject.
  if (dbSession.authentication_level === 'PASSWORD' || dbSession.authentication_level === 'OAUTH') {
    // Generate Security Event for blocked MFA bypass
    await prisma.securityEvent.create({
      data: {
        event_code: "AUTH_MFA_REQUIRED",
        source_type: "SYSTEM_ERROR_LOG",
        source_record_id: "mfa-guard",
        security_domain: "IDENTITY_AND_ACCESS",
        event_category: "Authentication",
        event_classification: "POLICY_VIOLATION",
        severity: "MEDIUM",
        environment: "DEVELOPMENT",
        lifecycle_type: "LIVE",
        target_user_id: (session.user as any).id,
        source_summary: { role, level: dbSession.authentication_level } as any,
        idempotency_key: `mfa_guard_${(session.user as any).id}_${Date.now()}`,
        occurred_at: new Date(),
        source_received_at: new Date()
      }
    });
    
    return { authorized: false, reason: 'MFA_REQUIRED' };
  }

  return { authorized: true };
}

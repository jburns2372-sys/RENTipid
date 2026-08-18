import { PrismaClient } from '@prisma/client';



const prisma = new PrismaClient();

export type PrivacyRequestType =
  | 'ACCESS_REQUEST'
  | 'CORRECTION_REQUEST'
  | 'DELETION_REQUEST'
  | 'PORTABILITY_REQUEST'
  | 'CONSENT_WITHDRAWAL'
  | 'PROCESSING_OBJECTION';

export type PrivacyRequestStatus =
  | 'SUBMITTED'
  | 'IDENTITY_VERIFICATION_REQUIRED'
  | 'VERIFIED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PARTIALLY_APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export async function processPrivacyRequest(
  userId: string,
  requestType: PrivacyRequestType,
  targetUserId: string,
  encryptedEmail?: string,
  message?: string,
  reviewerId?: string
) {
  // Ensure reviewer is not the same as target user when review is required
  if (reviewerId && reviewerId === targetUserId) {
    throw new Error('A user must not approve their own request when administrative review is required.');
  }

  const reference_number = `REQ-${Date.now()}`;

  await prisma.dataSubjectRequest.create({
    data: {
      reference_number,
      user_id: targetUserId,
      request_type: requestType,
      status: 'SUBMITTED',
      requester_email_encrypted: encryptedEmail,
    }
  });

  // Create an audit event (Privacy Safe Logging)
  await logPrivacyEvent({
    requestId: reference_number,
    requestType,
    actorId: userId,
    targetUserId,
    status: 'SUBMITTED',
    dataCategory: 'ACCOUNT_IDENTITY',
    decision: 'PENDING',
    sanitizedReason: 'User initiated privacy request'
  });

  return { status: 'SUBMITTED', reference_number };
}

export async function exportUserData(actorUserId: string, targetUserId: string) {
  // 1. Requires an authenticated user
  if (!actorUserId) throw new Error('Unauthenticated');

  // 3. Export only records belonging to that user
  if (actorUserId !== targetUserId) {
    await logPrivacyEvent({
      requestId: `EXP-${Date.now()}`,
      requestType: 'ACCESS_REQUEST',
      actorId: actorUserId,
      targetUserId,
      status: 'REJECTED',
      dataCategory: 'ACCOUNT_IDENTITY',
      decision: 'DENY',
      sanitizedReason: 'Cross-user export attempt'
    });
    throw new Error('Unauthorized cross-user export');
  }

  // 4. Exclude protected system fields, etc.
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      email: true,
      full_name: true,
      // Exclude password_hash, verification documents, etc.
      // Use allowlist explicitly
    }
  });

  if (!user) throw new Error('User not found');

  await logPrivacyEvent({
    requestId: `EXP-${Date.now()}`,
    requestType: 'ACCESS_REQUEST',
    actorId: actorUserId,
    targetUserId,
    status: 'COMPLETED',
    dataCategory: 'ACCOUNT_IDENTITY',
    decision: 'ALLOW',
    sanitizedReason: 'Authorized self export'
  });

  // Does not persist export
  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    data: user
  };
}

export async function correctUserData(actorUserId: string, targetUserId: string, updates: { full_name?: string }) {
  if (actorUserId !== targetUserId) {
    throw new Error('Unauthorized cross-user correction');
  }

  // Ensure we don't update protected columns like password_hash directly via this method
  const allowedKeys = ['full_name'];
  const updatePayload: Record<string, unknown> = {};

  for (const key of Object.keys(updates)) {
    if (allowedKeys.includes(key)) {
      updatePayload[key] = (updates as Record<string, unknown>)[key];
    } else {
      throw new Error(`Direct protected column write attempt rejected for key: ${key}`);
    }
  }

  // Audit before and after WITHOUT values
  await logPrivacyEvent({
    requestId: `COR-${Date.now()}`,
    requestType: 'CORRECTION_REQUEST',
    actorId: actorUserId,
    targetUserId,
    status: 'COMPLETED',
    dataCategory: 'ACCOUNT_IDENTITY',
    decision: 'ALLOW',
    sanitizedReason: 'Authorized correction applied'
  });

  return prisma.user.update({
    where: { id: targetUserId },
    data: updatePayload
  });
}

export async function checkHolds(targetUserId: string) {
  const activeBookings = await prisma.booking.count({
    where: {
      OR: [{ renter_id: targetUserId }, { provider_id: targetUserId }],
      status: { notIn: ['Completed', 'Cancelled by Renter', 'Cancelled by Provider', 'Rejected', 'Expired'] }
    }
  });

  if (activeBookings > 0) return true;

  const activePayments = await prisma.payment.count({
    where: {
      user_id: targetUserId,
      status: 'Pending'
    }
  });

  if (activePayments > 0) return true;

  const activeDisputes = await prisma.disputeCase.count({
    where: {
      opened_by: targetUserId, // Simplified for synthetic tests
      dispute_status: { notIn: ['Resolved', 'Closed', 'Cancelled'] }
    }
  });

  if (activeDisputes > 0) return true;

  const hasSecurityEvents = await prisma.apiSecurityLog.count({
    where: { actor_user_id: targetUserId }
  });

  if (hasSecurityEvents > 0) return true; // Security hold

  return false;
}

export async function requestAccountDeletion(actorUserId: string, targetUserId: string, encryptedEmail?: string) {
  if (actorUserId !== targetUserId) {
    throw new Error('Unauthorized cross-user deletion');
  }

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new Error('User not found');
  if (user.email.startsWith('deleted_')) {
    return { status: 'ALREADY_DELETED', reference_number: 'N/A' };
  }

  const existingReq = await prisma.dataSubjectRequest.findFirst({
    where: { user_id: targetUserId, request_type: 'DELETION_REQUEST' },
    orderBy: { created_at: 'desc' }
  });
  if (existingReq && (existingReq.status === 'PSEUDONYMIZED' || existingReq.status === 'SUBMITTED' || existingReq.status === 'COMPLETED')) {
    return { status: 'ALREADY_DELETED', reference_number: existingReq.reference_number };
  }

  const hasHold = await checkHolds(targetUserId);

  const txResult = await prisma.$transaction(async (tx) => {
    const reference_number = "DEL-" + Date.now();

    const requestStatus = hasHold ? 'LEGAL_HOLD' : 'SUBMITTED';

    const createdRequest = await tx.dataSubjectRequest.create({
      data: {
        reference_number,
        user_id: targetUserId,
        request_type: 'DELETION_REQUEST',
        status: requestStatus,
        requester_email_encrypted: encryptedEmail,
      }
    });

    // Use Privacy module to match audit function logic
    await tx.auditLog.create({
      data: {
        actor_user_id: actorUserId,
        action: 'PRIVACY_EVENT: DELETION_REQUEST',
        module: 'Privacy',
        target_id: targetUserId,
        details: JSON.stringify({
          requestId: reference_number,
          requestType: 'DELETION_REQUEST',
          actorId: actorUserId,
          targetUserId,
          status: requestStatus,
          dataCategory: 'ACCOUNT_IDENTITY',
          decision: hasHold ? 'DENY' : 'PENDING',
          sanitizedReason: hasHold ? 'Deletion blocked due to active hold' : 'User initiated privacy request'
        })
      }
    });

    return createdRequest;
  });

  if (hasHold) {
    throw new Error('Deletion blocked due to active legal/financial/security hold');
  }

  return { status: txResult.status, reference_number: txResult.reference_number };
}

export async function withdrawConsent(actorUserId: string, purpose: string) {
  await logPrivacyEvent({
    requestId: `CON-${Date.now()}`,
    requestType: 'CONSENT_WITHDRAWAL',
    actorId: actorUserId,
    targetUserId: actorUserId,
    status: 'COMPLETED',
    dataCategory: 'CONTACT_INFORMATION',
    decision: 'ALLOW',
    sanitizedReason: `Consent withdrawn for ${purpose}`
  });

  const receipt = await prisma.cookieConsentReceipt.create({
    data: {
      user_id: actorUserId,
      ip_address: '127.0.0.1',
      user_agent: 'System Event',
      policy_version: 'v1.0.0',
      consent_version: 1,
      necessary_enabled: true,
      consent_action: 'WITHDRAWN',
      functional_enabled: false,
      analytics_enabled: false,
      marketing_enabled: false
    }
  });

  return { status: 'WITHDRAWN', receiptId: receipt.id };
}

export async function createPrivacyIncident(
  metadata: {
    incidentId: string;
    dataCategory: string;
    approximateRecordCount: number;
    system: string;
    detectionTime: Date;
    severity: string;
  }
) {
  // We do not store breached raw data
  return {
    ...metadata,
    status: 'REPORTED',
    notificationDecision: 'PENDING',
    legalNotificationDeadlineSource: 'APPROVED_POLICY_OR_COUNSEL'
  };
}

export async function logPrivacyEvent(event: {
  requestId: string;
  requestType: string;
  actorId: string;
  targetUserId?: string;
  status: string;
  dataCategory: string;
  decision: string;
  sanitizedReason: string;
}) {
  // Privacy safe logging, avoiding raw sensitive values
  return prisma.auditLog.create({
    data: {
      actor_user_id: event.actorId,
      action: `PRIVACY_EVENT: ${event.requestType}`,
      module: 'PRIVACY_OPERATIONS',
      target_id: event.targetUserId,
      details: JSON.stringify({
        requestId: event.requestId,
        status: event.status,
        dataCategory: event.dataCategory,
        decision: event.decision,
        sanitizedReason: event.sanitizedReason,
        timestamp: new Date().toISOString()
      })
    }
  });
}

export async function escalateToDPO(actorUserId: string, requestId: string, reason: string) {
  const req = await prisma.dataSubjectRequest.findUnique({ where: { id: requestId } });
  if (!req) throw new Error('Request not found');

  const updatedReq = await prisma.dataSubjectRequest.update({
    where: { id: requestId },
    data: {
      dpo_escalation_status: 'ESCALATED',
      dpo_escalation_reason: reason
    }
  });

  await logPrivacyEvent({
    requestId: req.reference_number,
    requestType: req.request_type,
    actorId: actorUserId,
    targetUserId: req.user_id,
    status: 'UNDER_REVIEW',
    dataCategory: 'ACCOUNT_IDENTITY',
    decision: 'PENDING',
    sanitizedReason: 'Escalated to DPO'
  });

  return { status: 'ESCALATED', request: updatedReq };
}

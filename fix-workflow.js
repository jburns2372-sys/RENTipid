const fs = require('fs');
let code = fs.readFileSync('src/lib/privacy/privacy-workflow.ts', 'utf-8');

const processPrivacyRequestReplacement = `export async function processPrivacyRequest(
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
  
  const reference_number = \`REQ-\${Date.now()}\`;
  
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
}`;

const requestAccountDeletionReplacement = `export async function requestAccountDeletion(actorUserId: string, targetUserId: string, encryptedEmail?: string) {
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

  return { status: txResult.status, reference_number: txResult.reference_number };
}`;

code = code.replace(/export async function processPrivacyRequest[\s\S]*?(?=export async function exportUserData)/, processPrivacyRequestReplacement + '\n\n');

code = code.replace(/export async function requestAccountDeletion[\s\S]*?(?=export async function withdrawConsent)/, requestAccountDeletionReplacement + '\n\n');

fs.writeFileSync('src/lib/privacy/privacy-workflow.ts', code);
console.log('done');

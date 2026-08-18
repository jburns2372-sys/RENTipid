const fs = require('fs');
let code = fs.readFileSync('src/lib/privacy/privacy-workflow.ts', 'utf-8');

const escalateToDPO = `export async function escalateToDPO(actorUserId: string, requestId: string, reason: string) {
  const req = await prisma.dataSubjectRequest.findUnique({ where: { id: requestId } });
  if (!req) throw new Error('Request not found');

  const updatedReq = await prisma.dataSubjectRequest.update({
    where: { id: requestId },
    data: {
      dpo_escalation_status: 'ESCALATED',
      dpo_escalation_reason: reason,
      updated_at: new Date()
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
}`;

const withdrawConsentReplacement = `export async function withdrawConsent(actorUserId: string, purpose: string) {
  await logPrivacyEvent({
    requestId: \`CON-\${Date.now()}\`,
    requestType: 'CONSENT_WITHDRAWAL',
    actorId: actorUserId,
    targetUserId: actorUserId,
    status: 'COMPLETED',
    dataCategory: 'CONTACT_INFORMATION',
    decision: 'ALLOW',
    sanitizedReason: \`Consent withdrawn for \${purpose}\`
  });

  const receipt = await prisma.cookieConsentReceipt.create({
    data: {
      user_id: actorUserId,
      ip_address: '127.0.0.1', // mock or parameterize if needed
      consent_action: 'WITHDRAWN',
      functional_enabled: false,
      analytics_enabled: false,
      marketing_enabled: false
    }
  });

  return { status: 'WITHDRAWN', receiptId: receipt.id };
}`;

// Replace withdrawConsent
code = code.replace(/export async function withdrawConsent[\s\S]*?(?=export async function createPrivacyIncident)/, withdrawConsentReplacement + '\n\n');

// Add escalateToDPO at the end of the file
code += '\n' + escalateToDPO + '\n';

fs.writeFileSync('src/lib/privacy/privacy-workflow.ts', code);
console.log('done');

import { z } from 'zod';

export const PrivacyRequestTypeSchema = z.enum([
  'ACCESS_REQUEST',
  'CORRECTION_REQUEST',
  'DELETION_REQUEST',
  'PORTABILITY_REQUEST',
  'CONSENT_WITHDRAWAL',
  'PROCESSING_OBJECTION'
]);

export const PrivacyRequestPayloadSchema = z.object({
  request_type: PrivacyRequestTypeSchema,
  requester_email: z.string().email('Invalid email format').optional(),
  requester_message: z.string().max(1000).optional(),
});

export const ConsentWithdrawalPayloadSchema = z.object({
  purpose: z.string().min(1).max(255)
});

export const DpoEscalationPayloadSchema = z.object({
  requestId: z.string().min(1),
  reason: z.string().min(1).max(2000)
});

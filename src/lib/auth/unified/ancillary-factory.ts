import 'server-only';

import { AuthenticationSecurityLogAuditSink } from './audit';
import { AuthAncillaryService } from './ancillary';
import { PrismaAuthAncillaryRepository } from './ancillary-repository';
import { createAuthEmailDelivery } from './email-delivery';
import { BcryptPasswordHasher } from './password';
import { DatabaseAuthRateLimiter } from './rate-limiter';

export function createAuthAncillaryService() {
  return new AuthAncillaryService(
    new PrismaAuthAncillaryRepository(),
    createAuthEmailDelivery(),
    new DatabaseAuthRateLimiter(),
    new BcryptPasswordHasher(),
    { audit: new AuthenticationSecurityLogAuditSink() },
  );
}

export function resolveAuthPublicBaseUrl(requestUrl: string): string {
  const configuredUrl = process.env.NEXTAUTH_URL?.trim();
  const candidate = configuredUrl || new URL(requestUrl).origin;
  const parsed = new URL(candidate);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('AUTH_PUBLIC_URL_INVALID');
  }
  return parsed.origin;
}

import 'server-only';

import { AuthenticationSecurityLogAuditSink } from './audit';
import { BcryptPasswordHasher } from './password';
import { createPhoneVerificationProvider } from './phone-provider';
import { DatabaseAuthRateLimiter } from './rate-limiter';
import { PrismaUnifiedAuthRepository } from './repository';
import { PhoneOtpAuthenticationService, UnifiedAuthenticationService } from './services';

export function createUnifiedAuthenticationService() {
  return new UnifiedAuthenticationService(new PrismaUnifiedAuthRepository(), {
    audit: new AuthenticationSecurityLogAuditSink(),
    passwordHasher: new BcryptPasswordHasher(),
  });
}

export function createPhoneOtpAuthenticationService() {
  return new PhoneOtpAuthenticationService(
    new PrismaUnifiedAuthRepository(),
    createPhoneVerificationProvider(),
    new DatabaseAuthRateLimiter(),
    { audit: new AuthenticationSecurityLogAuditSink() },
  );
}

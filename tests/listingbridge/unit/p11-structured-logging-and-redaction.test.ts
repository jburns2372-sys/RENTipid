import { ListingBridgeStructuredLogger } from '../../../src/lib/listingbridge/observability/logger';
import { redactListingBridgeSecurityValue, redactListingBridgeSecurityDetails } from '../../../src/lib/listingbridge/security/errors';

describe('ListingBridge P11: Structured Logging & Safe Error Redaction', () => {
  const logger = ListingBridgeStructuredLogger.getInstance();

  it('Redacts Authorization headers, bearer tokens, and secrets from text strings', () => {
    const rawMessage = 'Failed request with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 and api_key=secret_12345';
    const redacted = redactListingBridgeSecurityValue(rawMessage);

    expect(redacted).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    expect(redacted).not.toContain('secret_12345');
    expect(redacted).toContain('[REDACTED]');
  });

  it('Recursively redacts sensitive keys from log detail objects', () => {
    const details = {
      importJobId: 'job-12345',
      authorization: 'Bearer token_secret_999',
      apiKey: 'key_abc_123',
      cookie: 'session_id=abcdef',
      safeParam: 'public_value',
      nested: {
        password: 'super_secret_password',
        status: 'OK',
      },
    };

    const redacted = redactListingBridgeSecurityDetails(details);

    expect(redacted.importJobId).toBe('job-12345');
    expect(redacted.safeParam).toBe('public_value');
    expect(redacted.authorization).toBe('[REDACTED]');
    expect(redacted.apiKey).toBe('[REDACTED]');
    expect(redacted.cookie).toBe('[REDACTED]');
    expect((redacted.nested as Record<string, unknown>).password).toBe('[REDACTED]');
    expect((redacted.nested as Record<string, unknown>).status).toBe('OK');
  });

  it('Emits operational event log with structured metadata and sanitized error codes', () => {
    // Should execute cleanly without error
    expect(() => {
      logger.logEvent({
        eventType: 'SOURCE_RETRIEVAL_FAILED',
        timestamp: new Date().toISOString(),
        importJobId: 'job-p11-log-001',
        connectorId: 'url-import',
        actorUserId: 'usr-p11-001',
        correlationId: 'corr-p11-999',
        resultClass: 'FAILURE',
        stage: 'FETCHING',
        failureCategory: 'TIMEOUT',
        durationMs: 450,
        safeMetadata: {
          urlHost: 'example.com',
          secretToken: 'secret_leak_attempt',
        },
      });
    }).not.toThrow();
  });
});

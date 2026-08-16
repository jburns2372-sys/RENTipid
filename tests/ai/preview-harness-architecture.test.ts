import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  IMPLEMENTED_PREVIEW_TRACE_IDS,
  NEXT_UNPROVABLE_PREVIEW_ID,
  PREVIEW_ACCEPTANCE_IDS,
} from '../preview/acceptance-ids';

describe('Preview-safe G11 harness architecture', () => {
  test('the manifest explicitly contains 45 unique applicable IDs', () => {
    expect(PREVIEW_ACCEPTANCE_IDS).toHaveLength(45);
    expect(new Set(PREVIEW_ACCEPTANCE_IDS).size).toBe(45);
  });

  test('Preview configuration has no direct database requirement or bypass', () => {
    const config = readFileSync(join(process.cwd(), 'playwright.preview.config.ts'), 'utf8');
    expect(config).toContain('PREVIEW_BASE_URL');
    expect(config).not.toMatch(/DATABASE_URL|PREVIEW_DATABASE_URL|ALLOW_REMOTE_DB|Prisma/);
    expect(config).not.toContain('test-database-guard');
  });

  test('A-SPEC-01 harness uses real HTTP correlation and registry comparison', () => {
    const harness = readFileSync(join(process.cwd(), 'tests/preview/g11-specialist-trace.spec.ts'), 'utf8');
    expect(harness).toContain(`post('/api/ai/chat'`);
    expect(harness).toContain(`headers()['x-rentipid-ai-trace-id']`);
    expect(harness).toContain('/api/admin/ai-customer-service/analytics?traceId=');
    expect(harness).toContain('intentOwnershipRegistry.resolveWithGeneralFallback');
    expect(harness).not.toContain('expect(true).toBe(true)');
  });

  test('trace-backed mappings stop at the next genuine Preview gap', () => {
    expect(IMPLEMENTED_PREVIEW_TRACE_IDS).toEqual([
      'A-SPEC-01', 'A-SPEC-02', 'A-SPEC-03', 'A-SPEC-04',
    ]);
    expect(NEXT_UNPROVABLE_PREVIEW_ID).toBe('A-SPEC-05');
  });
});

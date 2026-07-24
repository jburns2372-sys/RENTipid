import { PrismaClient, SecurityPlaybookStatus } from '@prisma/client';
import { assertSafeLocalTestDatabaseTarget } from '../../../src/lib/test-database-guard';
import { createPlaybookApiHandlers } from '../../../src/lib/security/playbooks/security-response-playbook-api';

const prisma = new PrismaClient();

describe('Gate 4G Slice A6 Playbook Activation and API Vertical', () => {
  let authorizedUserId: string;
  let unauthorizedUserId: string;

  beforeAll(async () => {
    assertSafeLocalTestDatabaseTarget();
    
    const authorized = await prisma.user.create({
      data: {
        email: `auth_${Date.now()}@test.com`,
        full_name: 'Authorized User',
        role: 'SOC_SUPERVISOR', // Typically has PLAYBOOK_ACTIVATE
        status: 'Verified',
        account_type: 'Individual',
      },
    });
    authorizedUserId = authorized.id;

    const unauthorized = await prisma.user.create({
      data: {
        email: `unauth_${Date.now()}@test.com`,
        full_name: 'Unauthorized User',
        role: 'GUEST', // No playbook permissions
        status: 'Verified',
        account_type: 'Individual',
      },
    });
    unauthorizedUserId = unauthorized.id;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { actor_user_id: { in: [authorizedUserId, unauthorizedUserId] } } });
    await prisma.securityResponseStep.deleteMany({ where: { playbook: { created_by_id: { in: [authorizedUserId, unauthorizedUserId] } } } });
    await prisma.securityResponsePlaybook.deleteMany({ where: { created_by_id: { in: [authorizedUserId, unauthorizedUserId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [authorizedUserId, unauthorizedUserId] } } });
    await prisma.$disconnect();
  });

  async function setupPlaybook(status: SecurityPlaybookStatus) {
    const playbook_id = `PB-TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const pb = await prisma.securityResponsePlaybook.create({
      data: {
        playbook_id,
        version: 0,
        name: 'Test Playbook',
        description: 'Test',
        status,
        lock_version: 0,
        created_by_id: authorizedUserId,
      }
    });
    return pb;
  }

  function mockRequest(body: Record<string, unknown>) {
    return new Request('http://localhost/api/soc/playbooks/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('Unauthenticated API request rejected', async () => {
    const handlers = createPlaybookApiHandlers({ database: prisma, getAuthenticatedUser: async () => null });
    const req = mockRequest({ playbook_id: 'test', expected_lock_version: 0 });
    const res = await handlers.activate(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('UNAUTHENTICATED');
  });

  it('Authenticated caller without permission rejected', async () => {
    const handlers = createPlaybookApiHandlers({ database: prisma, getAuthenticatedUser: async () => ({ id: unauthorizedUserId }) });
    const pb = await setupPlaybook('REVIEW_PENDING');
    const req = mockRequest({ playbook_id: pb.id, expected_lock_version: pb.lock_version });
    const res = await handlers.activate(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('UNAUTHORIZED');
  });

  it('Authorized activation succeeds and produces sanitized audit record', async () => {
    const handlers = createPlaybookApiHandlers({ database: prisma, getAuthenticatedUser: async () => ({ id: authorizedUserId }) });
    const pb = await setupPlaybook('REVIEW_PENDING');
    const req = mockRequest({ playbook_id: pb.id, expected_lock_version: pb.lock_version });
    const res = await handlers.activate(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    const updatedPb = await prisma.securityResponsePlaybook.findUnique({ where: { id: pb.id } });
    expect(updatedPb?.status).toBe('ACTIVE');
    expect(updatedPb?.lock_version).toBe(pb.lock_version + 1);

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'SOC_PLAYBOOK_ACTIVATED', target_id: pb.id },
      orderBy: { id: 'desc' }
    });
    expect(audit).toBeDefined();
    expect(audit?.actor_user_id).toBe(authorizedUserId);
    expect(audit?.details).not.toContain('password'); // sanitized
  });

  it('Invalid lifecycle transition rejected', async () => {
    const handlers = createPlaybookApiHandlers({ database: prisma, getAuthenticatedUser: async () => ({ id: authorizedUserId }) });
    const pb = await setupPlaybook('DRAFT'); // Not REVIEW_PENDING
    const req = mockRequest({ playbook_id: pb.id, expected_lock_version: pb.lock_version });
    const res = await handlers.activate(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('STALE_OR_INVALID_STATE');
  });

  it('Missing or malformed input rejected safely', async () => {
    const handlers = createPlaybookApiHandlers({ database: prisma, getAuthenticatedUser: async () => ({ id: authorizedUserId }) });
    const req = mockRequest({ playbook_id: '123' }); // missing lock_version
    const res = await handlers.activate(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('BAD_REQUEST');
    expect(body.details).toBeDefined();
    expect(JSON.stringify(body)).not.toContain('stack');
  });

  it('Nonexistent playbook/version rejected safely', async () => {
    const handlers = createPlaybookApiHandlers({ database: prisma, getAuthenticatedUser: async () => ({ id: authorizedUserId }) });
    const req = mockRequest({ playbook_id: 'nonexistent-id-123', expected_lock_version: 0 });
    const res = await handlers.activate(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('STALE_OR_INVALID_STATE');
  });

  it('Concurrent or stale activation attempt does not independently succeed (Idempotency)', async () => {
    const handlers = createPlaybookApiHandlers({ database: prisma, getAuthenticatedUser: async () => ({ id: authorizedUserId }) });
    const pb = await setupPlaybook('REVIEW_PENDING');
    
    // First request succeeds
    const req1 = mockRequest({ playbook_id: pb.id, expected_lock_version: pb.lock_version });
    const res1 = await handlers.activate(req1);
    expect(res1.status).toBe(200);

    // Second request with same stale lock version fails
    const req2 = mockRequest({ playbook_id: pb.id, expected_lock_version: pb.lock_version });
    const res2 = await handlers.activate(req2);
    expect(res2.status).toBe(400);
    const body = await res2.json();
    expect(body.error).toBe('STALE_OR_INVALID_STATE');

    // Second request with new lock version but invalid status also fails
    const req3 = mockRequest({ playbook_id: pb.id, expected_lock_version: pb.lock_version + 1 });
    const res3 = await handlers.activate(req3);
    expect(res3.status).toBe(400);
  });
});

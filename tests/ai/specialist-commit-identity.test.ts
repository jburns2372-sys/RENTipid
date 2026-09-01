/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { unifiedAiSpecialistOrchestrator } from '../../src/lib/ai/specialists/orchestrator';

describe('Unified AI Specialist Orchestrator - Commit Identity Resolution', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockSelection = {
    definition: { id: 'test_specialist', version: '1.0' },
    ownership: { intent: 'test_intent', consultedSpecialists: [] },
    fallbackTarget: 'NONE'
  } as any;

  const mockInvocation = {
    traceId: 'trace-123',
    sessionId: 'session-123',
    caseId: 'case-123',
    entityRefs: [],
    actorId: 'actor-123',
    persistedRole: 'Guest',
    intent: 'test_intent',
    answerClass: 'INFORMATION',
    specialistId: 'test_specialist',
    specialistVersion: '1.0',
    safeContext: { sourceRefs: [], authorizedContext: '' },
    allowedToolScopes: []
  } as any;

  const mockExecutor = {
    execute: async () => ({
      status: 'PASS',
      toolRequests: [],
      findings: [],
      unresolvedFacts: [],
      evidenceRefs: [],
      safeHoldReason: undefined
    })
  } as any;

  it('1. valid non-empty commit identity -> PASS', async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = '7513d497d7af68f06c27280389e89e117f2f7ce8';
    process.env.VERCEL_DEPLOYMENT_ID = undefined;
    
    const { trace } = await unifiedAiSpecialistOrchestrator.invoke(mockSelection, mockInvocation, mockExecutor);
    expect(trace.commitIdentity).toBe('7513d497d7af68f06c27280389e89e117f2f7ce8');
  });

  it('2. valid identity with surrounding whitespace -> normalized and PASS', async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = '  7513d497d7af68f06c27280389e89e117f2f7ce8  ';
    
    const { trace } = await unifiedAiSpecialistOrchestrator.invoke(mockSelection, mockInvocation, mockExecutor);
    expect(trace.commitIdentity).toBe('7513d497d7af68f06c27280389e89e117f2f7ce8');
  });

  it('3. VERCEL_GIT_COMMIT_SHA absent -> undefined / PASS', async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = undefined;
    
    const { trace } = await unifiedAiSpecialistOrchestrator.invoke(mockSelection, mockInvocation, mockExecutor);
    expect(trace.commitIdentity).toBeUndefined();
  });

  it('4. VERCEL_GIT_COMMIT_SHA empty or whitespace -> undefined / PASS', async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = '   ';
    
    const { trace } = await unifiedAiSpecialistOrchestrator.invoke(mockSelection, mockInvocation, mockExecutor);
    expect(trace.commitIdentity).toBeUndefined();
  });

  it('5. malformed explicitly supplied non-empty trace identity -> FAIL CLOSED', async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = 'a'.repeat(101); // Exceeds 100 character limit
    
    await expect(unifiedAiSpecialistOrchestrator.invoke(mockSelection, mockInvocation, mockExecutor))
      .rejects.toThrow('INVALID_SPECIALIST_TRACE_COMMIT_IDENTITY');
  });

  it('6. no fake SHA or deployment ID is invented', async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = undefined;
    process.env.VERCEL_DEPLOYMENT_ID = 'dpl_2EgbLsouZq2BdYwwbEG7k7KwU3mo';
    
    const { trace } = await unifiedAiSpecialistOrchestrator.invoke(mockSelection, mockInvocation, mockExecutor);
    expect(trace.commitIdentity).toBeUndefined();
  });

  it('7. VERCEL_DEPLOYMENT_ID alone does NOT become commitIdentity', async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = '';
    process.env.VERCEL_DEPLOYMENT_ID = 'dpl_test123';
    
    const { trace } = await unifiedAiSpecialistOrchestrator.invoke(mockSelection, mockInvocation, mockExecutor);
    expect(trace.commitIdentity).toBeUndefined();
  });

  it('8. specialist orchestration with absent optional Git SHA does not throw INVALID_SPECIALIST_TRACE_COMMIT_IDENTITY', async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = undefined;
    // The previous implementation threw if the SHA was missing/empty because it passed undefined/empty to bounded. 
    // Now it passes undefined which bounded accepts.
    const { trace } = await unifiedAiSpecialistOrchestrator.invoke(mockSelection, mockInvocation, mockExecutor);
    expect(trace.commitIdentity).toBeUndefined();
  });
});

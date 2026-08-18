import { assertKnowledgeMutationEnvironment } from '../../src/lib/ai/knowledge/environment-guard';
import { bootstrapKnowledge } from '../../src/lib/ai/knowledge/bootstrap';

const LOCAL_DATABASE_URL = 'postgresql://local-user:local-password@127.0.0.1:5432/rentipid_test_soc';
const PREVIEW_DATABASE_URL = 'postgresql://preview-user:preview-password@preview.example.net:5432/rentipid_preview?sslmode=require';
const PRODUCTION_DATABASE_URL = 'postgresql://prod-user:prod-password@rentipid-postgres-db.postgres.database.azure.com:5432/rentipid_db';

const localMutation = {
  ALLOW_KNOWLEDGE_MUTATION: 'true',
  DATABASE_URL: LOCAL_DATABASE_URL,
};

const previewEnvironment = {
  NODE_ENV: 'test',
  VERCEL_ENV: 'preview',
  DATABASE_URL: PREVIEW_DATABASE_URL,
};

describe('Knowledge mutation environment guard', () => {
  test('1. LOCAL with the base mutation flag remains authorized', () => {
    expect(assertKnowledgeMutationEnvironment({
      ...localMutation,
      NODE_ENV: 'development',
    })).toEqual(expect.objectContaining({
      kind: 'LOCAL_TEST',
      environment: 'LOCAL',
      databaseIdentity: 'TEST',
    }));
  });

  test('2. PREVIEW with neither authorization flag is rejected', () => {
    expect(() => assertKnowledgeMutationEnvironment(previewEnvironment))
      .toThrow('EXPLICIT_MUTATION_FLAG_REQUIRED');
  });

  test('3. PREVIEW with only the base mutation flag is rejected', () => {
    expect(() => assertKnowledgeMutationEnvironment({
      ...previewEnvironment,
      ALLOW_KNOWLEDGE_MUTATION: 'true',
    })).toThrow('PREVIEW_MUTATION_FLAG_REQUIRED');
  });

  test('4. PREVIEW with only the Preview flag is rejected', () => {
    expect(() => assertKnowledgeMutationEnvironment({
      ...previewEnvironment,
      ALLOW_PREVIEW_KNOWLEDGE_MUTATION: 'true',
    })).toThrow('EXPLICIT_MUTATION_FLAG_REQUIRED');
  });

  test('5. verified PREVIEW with both flags is authorized', () => {
    expect(assertKnowledgeMutationEnvironment({
      ...previewEnvironment,
      ALLOW_KNOWLEDGE_MUTATION: 'true',
      ALLOW_PREVIEW_KNOWLEDGE_MUTATION: 'true',
      PREVIEW_DATABASE_URL,
    })).toEqual(expect.objectContaining({
      kind: 'PREVIEW',
      environment: 'PREVIEW',
      databaseIdentity: 'PREVIEW',
      databaseName: 'rentipid_preview',
    }));
  });

  test('6. Production environment rejects both override flags', () => {
    expect(() => assertKnowledgeMutationEnvironment({
      ...previewEnvironment,
      NODE_ENV: 'production',
      ALLOW_KNOWLEDGE_MUTATION: 'true',
      ALLOW_PREVIEW_KNOWLEDGE_MUTATION: 'true',
    })).toThrow('NODE_ENV_PRODUCTION');
    expect(() => assertKnowledgeMutationEnvironment({
      ...previewEnvironment,
      VERCEL_ENV: 'production',
      ALLOW_KNOWLEDGE_MUTATION: 'true',
      ALLOW_PREVIEW_KNOWLEDGE_MUTATION: 'true',
    })).toThrow('VERCEL_ENV_PRODUCTION');
  });

  test('7. Production database rejects both override flags', () => {
    expect(() => assertKnowledgeMutationEnvironment({
      ...previewEnvironment,
      DATABASE_URL: PRODUCTION_DATABASE_URL,
      ALLOW_KNOWLEDGE_MUTATION: 'true',
      ALLOW_PREVIEW_KNOWLEDGE_MUTATION: 'true',
    })).toThrow('PRODUCTION_DATABASE');

    const referencedProduction = 'postgresql://vercel-user:vercel-password@remote.example.net:5432/verceldb';
    expect(() => assertKnowledgeMutationEnvironment({
      ...previewEnvironment,
      DATABASE_URL: referencedProduction,
      PRODUCTION_DATABASE_URL: referencedProduction,
      ALLOW_KNOWLEDGE_MUTATION: 'true',
      ALLOW_PREVIEW_KNOWLEDGE_MUTATION: 'true',
    })).toThrow('PRODUCTION_DATABASE');
  });

  test('8. Unknown remote database rejects both override flags', () => {
    expect(() => assertKnowledgeMutationEnvironment({
      ...previewEnvironment,
      DATABASE_URL: 'postgresql://remote-user:remote-password@unknown.example.net:5432/arbitrary_database',
      ALLOW_KNOWLEDGE_MUTATION: 'true',
      ALLOW_PREVIEW_KNOWLEDGE_MUTATION: 'true',
    })).toThrow('PREVIEW_DATABASE_IDENTITY_MISMATCH');
  });

  test('9. existing TEST convention remains authorized', () => {
    expect(assertKnowledgeMutationEnvironment({
      ...localMutation,
      NODE_ENV: 'test',
    })).toEqual(expect.objectContaining({
      kind: 'LOCAL_TEST',
      environment: 'TEST',
      databaseIdentity: 'TEST',
    }));
  });

  test('10. errors contain classifications only and never connection secrets', () => {
    const messages: string[] = [];
    for (const environment of [
      { ...previewEnvironment, ALLOW_KNOWLEDGE_MUTATION: 'true' },
      {
        ...previewEnvironment,
        DATABASE_URL: PRODUCTION_DATABASE_URL,
        ALLOW_KNOWLEDGE_MUTATION: 'true',
        ALLOW_PREVIEW_KNOWLEDGE_MUTATION: 'true',
      },
      {
        ...previewEnvironment,
        DATABASE_URL: 'postgresql://unknown-user:unknown-password@unknown.example.net:5432/unknown_database',
        ALLOW_KNOWLEDGE_MUTATION: 'true',
        ALLOW_PREVIEW_KNOWLEDGE_MUTATION: 'true',
      },
    ]) {
      try {
        assertKnowledgeMutationEnvironment(environment);
      } catch (error) {
        messages.push(error instanceof Error ? error.message : String(error));
      }
    }
    const output = messages.join('\n');
    expect(output).not.toMatch(/postgres(?:ql)?:\/\//i);
    expect(output).not.toContain('password');
    expect(output).not.toContain('preview-user');
    expect(output).not.toContain('prod-user');
    expect(output).not.toContain('unknown-user');
  });

  test.each(['bootstrap', 'sync'])('%s command authorization uses the same two-flag Preview gate', command => {
    expect(command).toMatch(/^(?:bootstrap|sync)$/);
    expect(() => assertKnowledgeMutationEnvironment({
      ...previewEnvironment,
      ALLOW_KNOWLEDGE_MUTATION: 'true',
    })).toThrow('PREVIEW_MUTATION_FLAG_REQUIRED');
    expect(assertKnowledgeMutationEnvironment({
      ...previewEnvironment,
      ALLOW_KNOWLEDGE_MUTATION: 'true',
      ALLOW_PREVIEW_KNOWLEDGE_MUTATION: 'true',
    }).kind).toBe('PREVIEW');
  });

  test('bootstrap rejects before any database work when Preview authorization is incomplete', async () => {
    await expect(bootstrapKnowledge({} as never, {
      environment: {
        ...previewEnvironment,
        ALLOW_KNOWLEDGE_MUTATION: 'true',
      },
    })).rejects.toThrow('PREVIEW_MUTATION_FLAG_REQUIRED');
  });
});

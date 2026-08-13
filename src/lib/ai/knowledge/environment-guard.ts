export interface KnowledgeEnvironmentIdentity {
  kind: 'LOCAL_TEST';
  databaseName: string;
  host: string;
}

export function assertKnowledgeMutationEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): KnowledgeEnvironmentIdentity {
  if (environment.NODE_ENV === 'production') {
    throw new Error('KNOWLEDGE_ENVIRONMENT_REJECTED:NODE_ENV_PRODUCTION');
  }
  if (environment.VERCEL_ENV === 'production') {
    throw new Error('KNOWLEDGE_ENVIRONMENT_REJECTED:VERCEL_ENV_PRODUCTION');
  }
  if (environment.VERCEL_ENV === 'preview') {
    throw new Error('KNOWLEDGE_ENVIRONMENT_REJECTED:PREVIEW_NOT_AUTHORIZED');
  }
  if (environment.ALLOW_KNOWLEDGE_MUTATION !== 'true') {
    throw new Error('KNOWLEDGE_ENVIRONMENT_REJECTED:EXPLICIT_MUTATION_FLAG_REQUIRED');
  }
  if (!environment.DATABASE_URL) {
    throw new Error('KNOWLEDGE_ENVIRONMENT_REJECTED:DATABASE_IDENTITY_MISSING');
  }
  let url: URL;
  try {
    url = new URL(environment.DATABASE_URL);
  } catch {
    throw new Error('KNOWLEDGE_ENVIRONMENT_REJECTED:DATABASE_IDENTITY_MALFORMED');
  }
  const host = url.hostname.toLowerCase();
  const databaseName = url.pathname.replace(/^\//, '').split('?')[0];
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    throw new Error('KNOWLEDGE_ENVIRONMENT_REJECTED:NON_LOCAL_DATABASE');
  }
  if (!/^rentipid_test_soc(?:_[0-9]+)?$/i.test(databaseName)) {
    throw new Error('KNOWLEDGE_ENVIRONMENT_REJECTED:UNKNOWN_LOCAL_DATABASE');
  }
  return { kind: 'LOCAL_TEST', databaseName, host };
}

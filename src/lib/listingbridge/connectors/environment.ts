import type { ListingBridgeDeploymentEnvironment } from './descriptor';

/**
 * Resolves the deployment environment for ListingBridge using authoritative
 * runtime signals (VERCEL_ENV, APP_ENV, and NODE_ENV).
 *
 * Evaluation rules:
 * - VERCEL_ENV === 'preview' => PREVIEW
 * - VERCEL_ENV === 'production' => PRODUCTION
 * - VERCEL_ENV === 'development' => LOCAL
 * - APP_ENV === 'preview' | 'staging' | 'uat' => PREVIEW
 * - APP_ENV === 'production' | 'prod' => PRODUCTION
 * - APP_ENV === 'development' | 'dev' | 'local' => LOCAL
 * - APP_ENV === 'test' => TEST
 * - NODE_ENV === 'test' => TEST
 * - NODE_ENV === 'development' => LOCAL
 * - NODE_ENV === 'production' without Preview signal => PRODUCTION (fail closed)
 * - Ambiguous / missing signals => PRODUCTION (fail closed)
 */
export function resolveListingBridgeEnvironment(
  env: Record<string, string | undefined> = process.env,
): ListingBridgeDeploymentEnvironment {
  const vercelEnv = env.VERCEL_ENV?.trim().toLowerCase();
  const appEnv = env.APP_ENV?.trim().toLowerCase();
  const nodeEnv = env.NODE_ENV?.trim().toLowerCase();

  // 1. Explicit Vercel platform environment
  if (vercelEnv === 'preview') {
    return 'PREVIEW';
  }
  if (vercelEnv === 'production') {
    return 'PRODUCTION';
  }
  if (vercelEnv === 'development') {
    return 'LOCAL';
  }

  // 2. Explicit application environment
  if (appEnv === 'preview' || appEnv === 'staging' || appEnv === 'uat') {
    return 'PREVIEW';
  }
  if (appEnv === 'production' || appEnv === 'prod') {
    return 'PRODUCTION';
  }
  if (appEnv === 'development' || appEnv === 'dev' || appEnv === 'local') {
    return 'LOCAL';
  }
  if (appEnv === 'test') {
    return 'TEST';
  }

  // 3. Fallback to NODE_ENV
  if (nodeEnv === 'test') {
    return 'TEST';
  }
  if (nodeEnv === 'development') {
    return 'LOCAL';
  }
  if (nodeEnv === 'production') {
    return 'PRODUCTION';
  }

  // 4. Default: fail closed to PRODUCTION
  return 'PRODUCTION';
}

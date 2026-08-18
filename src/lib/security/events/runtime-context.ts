import { SecurityEnvironment, SecurityLifecycle } from "./taxonomy";

export function resolveSecurityRuntimeContext(
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>
): {
  environment: SecurityEnvironment;
  lifecycle: SecurityLifecycle;
} {
  const currentEnv = env || process.env;

  const overrideEnv = currentEnv.SECURITY_EVENT_ENVIRONMENT;
  const overrideLife = currentEnv.SECURITY_EVENT_LIFECYCLE;

  if (overrideEnv !== undefined && overrideLife !== undefined) {
    if (overrideEnv === SecurityEnvironment.DEVELOPMENT && overrideLife === SecurityLifecycle.TEST) return { environment: SecurityEnvironment.DEVELOPMENT, lifecycle: SecurityLifecycle.TEST };
    if (overrideEnv === SecurityEnvironment.TEST && overrideLife === SecurityLifecycle.TEST) return { environment: SecurityEnvironment.TEST, lifecycle: SecurityLifecycle.TEST };
    if (overrideEnv === SecurityEnvironment.UAT && overrideLife === SecurityLifecycle.TEST) return { environment: SecurityEnvironment.UAT, lifecycle: SecurityLifecycle.TEST };
    if (overrideEnv === SecurityEnvironment.STAGING && overrideLife === SecurityLifecycle.TEST) return { environment: SecurityEnvironment.STAGING, lifecycle: SecurityLifecycle.TEST };
    if (overrideEnv === SecurityEnvironment.PRODUCTION && overrideLife === SecurityLifecycle.LIVE) return { environment: SecurityEnvironment.PRODUCTION, lifecycle: SecurityLifecycle.LIVE };
    
    throw new Error("SECURITY_RUNTIME_CONTEXT_UNRESOLVED");
  }

  if (overrideEnv !== undefined || overrideLife !== undefined) {
    throw new Error("SECURITY_RUNTIME_CONTEXT_UNRESOLVED");
  }

  const nodeEnv = currentEnv.NODE_ENV;

  if (nodeEnv === "test") {
    return { environment: SecurityEnvironment.TEST, lifecycle: SecurityLifecycle.TEST };
  }

  if (nodeEnv === "development") {
    return { environment: SecurityEnvironment.DEVELOPMENT, lifecycle: SecurityLifecycle.TEST };
  }

  if (nodeEnv === "production") {
    const vercelEnv = currentEnv.VERCEL_ENV;
    if (vercelEnv === "production") {
      return { environment: SecurityEnvironment.PRODUCTION, lifecycle: SecurityLifecycle.LIVE };
    }
    if (vercelEnv === "preview") {
      return { environment: SecurityEnvironment.UAT, lifecycle: SecurityLifecycle.TEST };
    }
    if (vercelEnv === "development") {
      return { environment: SecurityEnvironment.DEVELOPMENT, lifecycle: SecurityLifecycle.TEST };
    }
  }

  throw new Error("SECURITY_RUNTIME_CONTEXT_UNRESOLVED");
}

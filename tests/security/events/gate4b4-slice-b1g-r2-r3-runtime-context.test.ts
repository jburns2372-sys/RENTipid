import { resolveSecurityRuntimeContext } from "../../../src/lib/security/events/runtime-context";
import { SecurityEnvironment, SecurityLifecycle } from "../../../src/lib/security/events/taxonomy";

describe("GATE4B4_SLICE_B1G_R2_R3: Canonical Security Runtime Context", () => {
  it("1. Explicit valid TEST pair resolves correctly", () => {
    const env = {
      SECURITY_EVENT_ENVIRONMENT: "TEST",
      SECURITY_EVENT_LIFECYCLE: "TEST"
    };
    const result = resolveSecurityRuntimeContext(env);
    expect(result.environment).toBe(SecurityEnvironment.TEST);
    expect(result.lifecycle).toBe(SecurityLifecycle.TEST);
  });

  it("2. Partial override is rejected", () => {
    const env = {
      SECURITY_EVENT_ENVIRONMENT: "TEST",
      NODE_ENV: "test" // this is to show that even if node_env exists, partial override throws
    };
    expect(() => resolveSecurityRuntimeContext(env)).toThrow("SECURITY_RUNTIME_CONTEXT_UNRESOLVED");
    
    const env2 = {
      SECURITY_EVENT_LIFECYCLE: "TEST"
    };
    expect(() => resolveSecurityRuntimeContext(env2)).toThrow("SECURITY_RUNTIME_CONTEXT_UNRESOLVED");
  });

  it("3. Invalid override pair is rejected", () => {
    const env = {
      SECURITY_EVENT_ENVIRONMENT: "PRODUCTION",
      SECURITY_EVENT_LIFECYCLE: "TEST"
    };
    expect(() => resolveSecurityRuntimeContext(env)).toThrow("SECURITY_RUNTIME_CONTEXT_UNRESOLVED");
  });

  it("4. NODE_ENV=test resolves TEST / TEST", () => {
    const env = {
      NODE_ENV: "test"
    };
    const result = resolveSecurityRuntimeContext(env);
    expect(result.environment).toBe(SecurityEnvironment.TEST);
    expect(result.lifecycle).toBe(SecurityLifecycle.TEST);
  });

  it("5. NODE_ENV=development resolves DEVELOPMENT / TEST", () => {
    const env = {
      NODE_ENV: "development"
    };
    const result = resolveSecurityRuntimeContext(env);
    expect(result.environment).toBe(SecurityEnvironment.DEVELOPMENT);
    expect(result.lifecycle).toBe(SecurityLifecycle.TEST);
  });

  it("6. Vercel preview resolves UAT / TEST", () => {
    const env = {
      NODE_ENV: "production",
      VERCEL_ENV: "preview"
    };
    const result = resolveSecurityRuntimeContext(env);
    expect(result.environment).toBe(SecurityEnvironment.UAT);
    expect(result.lifecycle).toBe(SecurityLifecycle.TEST);
  });

  it("7. Vercel production resolves PRODUCTION / LIVE", () => {
    const env = {
      NODE_ENV: "production",
      VERCEL_ENV: "production"
    };
    const result = resolveSecurityRuntimeContext(env);
    expect(result.environment).toBe(SecurityEnvironment.PRODUCTION);
    expect(result.lifecycle).toBe(SecurityLifecycle.LIVE);
  });

  it("8. Unresolved production configuration fails closed", () => {
    const env = {
      NODE_ENV: "production",
      VERCEL_ENV: "unknown"
    };
    expect(() => resolveSecurityRuntimeContext(env)).toThrow("SECURITY_RUNTIME_CONTEXT_UNRESOLVED");

    const env2 = {
      NODE_ENV: "production"
    };
    expect(() => resolveSecurityRuntimeContext(env2)).toThrow("SECURITY_RUNTIME_CONTEXT_UNRESOLVED");

    const env3 = {};
    expect(() => resolveSecurityRuntimeContext(env3)).toThrow("SECURITY_RUNTIME_CONTEXT_UNRESOLVED");
  });
});

import { resolveGroundedInformationProvider } from './grounded-information-provider';

describe('Grounded Information Provider', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_GROUNDED_COMPOSER_ENABLED = 'true';
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_GROUNDED_COMPOSER_ENABLED;
  });

  it('should resolve openai provider when mode is openai', () => {
    const provider = resolveGroundedInformationProvider('openai');
    expect(provider).toBeDefined();
    expect(provider?.name).toBe('openai');
    expect(provider?.mode).toBe('GROUNDED_GENERATIVE');
    expect(provider?.available()).toBe(true);
  });

  it('should resolve fallback provider when mode is deterministic-evidence-fallback', () => {
    const provider = resolveGroundedInformationProvider('deterministic-evidence-fallback');
    expect(provider).toBeDefined();
    expect(provider?.name).toBe('deterministic-evidence-fallback');
    expect(provider?.mode).toBe('DETERMINISTIC_FALLBACK');
    expect(provider?.available()).toBe(true);
  });

  it('should return null for unknown mode', () => {
    const provider = resolveGroundedInformationProvider('unknown');
    expect(provider).toBeNull();
  });
  
  it('openai provider should not be available if not enabled in config', () => {
    process.env.OPENAI_GROUNDED_COMPOSER_ENABLED = 'false';
    const provider = resolveGroundedInformationProvider('openai');
    expect(provider?.available()).toBe(false);
  });
});

import { 
  ProfileProtectionMode, 
  getProfileProtectionMode, 
  injectProfileProtectionMode 
} from '../../../src/lib/security/crypto/profile-protection-mode';

describe('Profile Protection Operating Mode', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    injectProfileProtectionMode(null);
  });

  afterAll(() => {
    process.env = originalEnv;
    injectProfileProtectionMode(null);
  });

  it('defaults to LEGACY_ONLY when env var is not set', () => {
    delete process.env.PROFILE_FIELD_PROTECTION_MODE;
    expect(getProfileProtectionMode()).toBe(ProfileProtectionMode.LEGACY_ONLY);
  });

  it('defaults to LEGACY_ONLY when env var is unknown', () => {
    process.env.PROFILE_FIELD_PROTECTION_MODE = 'SOME_UNKNOWN_MODE';
    expect(getProfileProtectionMode()).toBe(ProfileProtectionMode.LEGACY_ONLY);
  });

  it('reads DUAL_READ_ENCRYPTED_WRITE from env', () => {
    process.env.PROFILE_FIELD_PROTECTION_MODE = 'DUAL_READ_ENCRYPTED_WRITE';
    expect(getProfileProtectionMode()).toBe(ProfileProtectionMode.DUAL_READ_ENCRYPTED_WRITE);
  });

  it('reads ENCRYPTED_ONLY from env', () => {
    process.env.PROFILE_FIELD_PROTECTION_MODE = 'ENCRYPTED_ONLY';
    expect(getProfileProtectionMode()).toBe(ProfileProtectionMode.ENCRYPTED_ONLY);
  });

  it('reads WRITE_FROZEN from env', () => {
    process.env.PROFILE_FIELD_PROTECTION_MODE = 'WRITE_FROZEN';
    expect(getProfileProtectionMode()).toBe(ProfileProtectionMode.WRITE_FROZEN);
  });

  it('allows injection of mode for tests', () => {
    process.env.PROFILE_FIELD_PROTECTION_MODE = 'LEGACY_ONLY';
    injectProfileProtectionMode(ProfileProtectionMode.WRITE_FROZEN);
    expect(getProfileProtectionMode()).toBe(ProfileProtectionMode.WRITE_FROZEN);
  });
});

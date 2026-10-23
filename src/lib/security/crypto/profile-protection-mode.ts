export enum ProfileProtectionMode {
  LEGACY_ONLY = 'LEGACY_ONLY',
  DUAL_READ_ENCRYPTED_WRITE = 'DUAL_READ_ENCRYPTED_WRITE',
  ENCRYPTED_ONLY = 'ENCRYPTED_ONLY',
  WRITE_FROZEN = 'WRITE_FROZEN'
}

let testInjectedMode: ProfileProtectionMode | null = null;

export function injectProfileProtectionMode(mode: ProfileProtectionMode | null): void {
  testInjectedMode = mode;
}

export function getProfileProtectionMode(): ProfileProtectionMode {
  if (testInjectedMode) {
    return testInjectedMode;
  }

  const envMode = process.env.PROFILE_FIELD_PROTECTION_MODE;
  
  if (envMode === 'DUAL_READ_ENCRYPTED_WRITE') {
    return ProfileProtectionMode.DUAL_READ_ENCRYPTED_WRITE;
  }
  
  if (envMode === 'ENCRYPTED_ONLY') {
    return ProfileProtectionMode.ENCRYPTED_ONLY;
  }
  
  if (envMode === 'WRITE_FROZEN') {
    return ProfileProtectionMode.WRITE_FROZEN;
  }
  
  // Default and safe fallback for unknown values
  return ProfileProtectionMode.LEGACY_ONLY;
}

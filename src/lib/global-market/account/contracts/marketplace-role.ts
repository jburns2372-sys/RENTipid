/**
 * RENTipid GLOBAL-MKT / v2.0 — Marketplace Role Contract
 *
 * Implements the clean separation between Administrative/System Roles (RBAC)
 * and Commercial Marketplace Roles (Renter, Provider, or Dual Role).
 */

export const MARKETPLACE_ROLES = ['RENTER', 'PROVIDER'] as const;
export type MarketplaceRole = (typeof MARKETPLACE_ROLES)[number];

export const ALL_MARKETPLACE_ROLES: readonly MarketplaceRole[] = Object.freeze([...MARKETPLACE_ROLES]);

export const SYSTEM_ROLES = [
  'GUEST',
  'USER',
  'ADMIN',
  'FINANCE_ADMIN',
  'COMPLIANCE_ADMIN',
  'SUPER_ADMIN',
] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];

export const ALL_SYSTEM_ROLES: readonly SystemRole[] = Object.freeze([...SYSTEM_ROLES]);

/**
 * Checks if a user has a specific marketplace role.
 */
export function hasMarketplaceRole(
  roles: readonly MarketplaceRole[] | null | undefined,
  targetRole: MarketplaceRole
): boolean {
  if (!roles || !Array.isArray(roles)) return false;
  return roles.includes(targetRole);
}

/**
 * Checks if a user can act as a Renter.
 * Active accounts with RENTER role can act as renters.
 */
export function canActAsRenter(
  roles: readonly MarketplaceRole[] | null | undefined,
  accountStatus: string = 'Verified'
): boolean {
  if (['Suspended', 'Blacklisted', 'Disabled'].includes(accountStatus)) {
    return false;
  }
  return hasMarketplaceRole(roles, 'RENTER');
}

/**
 * Checks if a user can act as a Provider.
 * Requires PROVIDER marketplace role, non-suspended account status,
 * and valid provider onboarding state.
 */
export function canActAsProvider(
  roles: readonly MarketplaceRole[] | null | undefined,
  accountStatus: string = 'Verified',
  onboardingState: string = 'APPROVED'
): boolean {
  if (['Suspended', 'Blacklisted', 'Disabled'].includes(accountStatus)) {
    return false;
  }
  if (!hasMarketplaceRole(roles, 'PROVIDER')) {
    return false;
  }
  return onboardingState === 'APPROVED';
}

/**
 * Maps legacy database User.role string to typed SystemRole and MarketplaceRole list.
 * Preserves 100% backward compatibility for existing users while supporting dual roles.
 */
export function mapLegacyUserRoleToSystemAndMarketplace(
  legacyRole: string | null | undefined,
  accountType?: string | null
): { systemRole: SystemRole; marketplaceRoles: MarketplaceRole[] } {
  if (!legacyRole || typeof legacyRole !== 'string') {
    return { systemRole: 'USER', marketplaceRoles: ['RENTER'] };
  }

  const normalized = legacyRole.trim();

  // Administrative / System Roles
  switch (normalized.toUpperCase()) {
    case 'SUPER ADMIN':
    case 'SUPER_ADMIN':
      return { systemRole: 'SUPER_ADMIN', marketplaceRoles: [] };
    case 'ADMIN':
      return { systemRole: 'ADMIN', marketplaceRoles: [] };
    case 'FINANCE ADMIN':
    case 'FINANCE_ADMIN':
      return { systemRole: 'FINANCE_ADMIN', marketplaceRoles: [] };
    case 'COMPLIANCE ADMIN':
    case 'COMPLIANCE_ADMIN':
      return { systemRole: 'COMPLIANCE_ADMIN', marketplaceRoles: [] };
    case 'GUEST':
      return { systemRole: 'GUEST', marketplaceRoles: [] };

    // Commercial Marketplace Roles
    case 'PROVIDER':
    case 'INDIVIDUAL PROVIDER':
    case 'BUSINESS PROVIDER':
      // Providers can also rent items in the global marketplace (Dual Role support)
      return { systemRole: 'USER', marketplaceRoles: ['RENTER', 'PROVIDER'] };
    case 'USER':
    case 'RENTER':
    default:
      return { systemRole: 'USER', marketplaceRoles: ['RENTER'] };
  }
}

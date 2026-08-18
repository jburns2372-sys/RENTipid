import type { UserRole } from '@/lib/security/permissions';
import type { KnowledgeVisibility } from './types';

const ROLE_ALIASES: Record<string, UserRole> = {
  GUEST: 'Guest',
  RENTER: 'Renter',
  PROVIDER: 'Business Provider',
  INDIVIDUAL_PROVIDER: 'Individual Provider',
  'INDIVIDUAL PROVIDER': 'Individual Provider',
  BUSINESS_PROVIDER: 'Business Provider',
  'BUSINESS PROVIDER': 'Business Provider',
  ADMIN: 'Admin',
  FINANCE_ADMIN: 'Finance Admin',
  'FINANCE ADMIN': 'Finance Admin',
  COMPLIANCE_ADMIN: 'Compliance Admin',
  'COMPLIANCE ADMIN': 'Compliance Admin',
  SOC_ANALYST: 'SOC_ANALYST',
  SOC_SUPERVISOR: 'SOC_SUPERVISOR',
  SUPER_ADMIN: 'Super Admin',
  'SUPER ADMIN': 'Super Admin',
  OWNER: 'Super Admin',
};

export function resolveKnowledgeRole(role: string | undefined): UserRole {
  if (!role) return 'Guest';
  return ROLE_ALIASES[role.trim().toUpperCase()] ?? 'Guest';
}

export function parseStoredRoles(value: unknown, legacy?: string): string[] {
  if (Array.isArray(value)) return value.filter((role): role is string => typeof role === 'string').map(role => role.trim());
  if (legacy) return legacy.split(',').map(role => role.trim()).filter(Boolean);
  return [];
}

export function canAccessKnowledge(
  visibility: string,
  roles: string[],
  role: string | undefined,
): boolean {
  const resolvedRole = resolveKnowledgeRole(role);
  const normalizedVisibility = visibility as KnowledgeVisibility;
  if (normalizedVisibility === 'SYSTEM_ONLY') return false;
  if (normalizedVisibility === 'PUBLIC') return true;
  if (normalizedVisibility === 'AUTHENTICATED') return resolvedRole !== 'Guest';
  if (normalizedVisibility === 'SUPER_ADMIN_ONLY') return resolvedRole === 'Super Admin';
  if (resolvedRole === 'Super Admin') return true;
  return roles.some(allowed => resolveKnowledgeRole(allowed) === resolvedRole);
}

export function canChunkNarrowParent(
  parentVisibility: KnowledgeVisibility,
  childVisibility?: KnowledgeVisibility,
): boolean {
  if (!childVisibility || childVisibility === parentVisibility) return true;
  const rank: Record<KnowledgeVisibility, number> = {
    PUBLIC: 0,
    AUTHENTICATED: 1,
    ROLE_SCOPED: 2,
    SUPER_ADMIN_ONLY: 3,
    SYSTEM_ONLY: 4,
  };
  return rank[childVisibility] >= rank[parentVisibility];
}

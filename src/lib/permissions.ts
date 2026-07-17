// RENTipid Role-Based Access Control Structure

export type UserRole = 
  | 'Guest'
  | 'Renter'
  | 'Individual Provider'
  | 'Business Provider'
  | 'Admin'
  | 'Finance Admin'
  | 'Compliance Admin'
  | 'Super Admin';

export type PermissionModule = 
  | 'listings'
  | 'bookings'
  | 'payments'
  | 'disputes'
  | 'kyc_approval'
  | 'system_settings'
  | 'audit_logs'
  | 'security_rules';

export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'approve' | 'execute' | 'view' | 'initialize' | 'validate' | 'activate';

// This is a placeholder structure for Phase 1
export const ROLE_PERMISSIONS: Record<UserRole, Record<PermissionModule, PermissionAction[]>> = {
  'Guest': {
    listings: ['read'],
    bookings: [],
    payments: [],
    disputes: [],
    kyc_approval: [],
    system_settings: [],
    audit_logs: [],
    security_rules: [],
  },
  'Renter': {
    listings: ['read'],
    bookings: ['read', 'create'],
    payments: ['read', 'create'],
    disputes: ['read', 'create'],
    kyc_approval: [],
    system_settings: [],
    audit_logs: [],
    security_rules: [],
  },
  'Individual Provider': {
    listings: ['read', 'create', 'update', 'delete'],
    bookings: ['read', 'approve'],
    payments: ['read'],
    disputes: ['read', 'create'],
    kyc_approval: [],
    system_settings: [],
    audit_logs: [],
    security_rules: [],
  },
  'Business Provider': {
    listings: ['read', 'create', 'update', 'delete'],
    bookings: ['read', 'approve'],
    payments: ['read'],
    disputes: ['read', 'create'],
    kyc_approval: [],
    system_settings: [],
    audit_logs: [],
    security_rules: [],
  },
  'Admin': {
    listings: ['read', 'update'],
    bookings: ['read', 'update'],
    payments: ['read'],
    disputes: ['read', 'update', 'approve'],
    kyc_approval: ['read', 'approve'],
    system_settings: [],
    audit_logs: ['read'],
    security_rules: [],
  },
  'Compliance Admin': {
    listings: ['read', 'update', 'approve'],
    bookings: ['read'],
    payments: [],
    disputes: ['read', 'update', 'approve'],
    kyc_approval: ['read', 'update', 'approve'],
    system_settings: [],
    audit_logs: ['read'],
    security_rules: [],
  },
  'Finance Admin': {
    listings: ['read'],
    bookings: ['read'],
    payments: ['read', 'update', 'approve', 'execute'],
    disputes: ['read'],
    kyc_approval: [],
    system_settings: [],
    audit_logs: ['read'],
    security_rules: [],
  },
  'Super Admin': {
    listings: ['read', 'create', 'update', 'delete', 'approve'],
    bookings: ['read', 'create', 'update', 'delete', 'approve'],
    payments: ['read', 'create', 'update', 'delete', 'approve', 'execute'],
    disputes: ['read', 'create', 'update', 'delete', 'approve'],
    kyc_approval: ['read', 'update', 'approve'],
    system_settings: ['read', 'create', 'update', 'delete'],
    audit_logs: ['read', 'delete'],
    security_rules: ['view', 'initialize', 'validate', 'activate'],
  }
};

export const hasPermission = (role: UserRole, module: PermissionModule, action: PermissionAction): boolean => {
  return ROLE_PERMISSIONS[role]?.[module]?.includes(action) || false;
};

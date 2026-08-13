// ----------------------------------------------------------------------
// Phase 10: Social Media, Promotion & Feedback Intelligence Module
// Phase 3: Database & Shared Foundation - RBAC Dictionary
// ----------------------------------------------------------------------

export const SOCIAL_PERMISSIONS = {
  VIEW: 'social.view',
  CREATE: 'social.create',
  EDIT: 'social.edit',
  APPROVE: 'social.approve',
  SCHEDULE: 'social.schedule',
  PUBLISH: 'social.publish',
  ANALYTICS_VIEW: 'social.analytics.view',
  ACCOUNTS_MANAGE: 'social.accounts.manage',
  FEEDBACK_VIEW: 'social.feedback.view',
  FEEDBACK_RESPOND: 'social.feedback.respond',
  ADMIN: 'social.admin',
} as const;

type SocialPermission = typeof SOCIAL_PERMISSIONS[keyof typeof SOCIAL_PERMISSIONS];

export function getPermissionsForRole(role: string): SocialPermission[] {
  switch (role) {
    case 'Super Admin':
      return Object.values(SOCIAL_PERMISSIONS);
      
    case 'Admin':
      return [
        SOCIAL_PERMISSIONS.VIEW,
        SOCIAL_PERMISSIONS.CREATE,
        SOCIAL_PERMISSIONS.EDIT,
        SOCIAL_PERMISSIONS.APPROVE,
        SOCIAL_PERMISSIONS.SCHEDULE,
        SOCIAL_PERMISSIONS.PUBLISH,
        SOCIAL_PERMISSIONS.ANALYTICS_VIEW,
        SOCIAL_PERMISSIONS.FEEDBACK_VIEW,
        SOCIAL_PERMISSIONS.FEEDBACK_RESPOND,
      ];
      
    case 'Compliance Admin':
      return [
        SOCIAL_PERMISSIONS.VIEW,
        SOCIAL_PERMISSIONS.ANALYTICS_VIEW,
        SOCIAL_PERMISSIONS.FEEDBACK_VIEW,
      ];
      
    case 'Finance Admin':
      return [
        SOCIAL_PERMISSIONS.ANALYTICS_VIEW,
      ];
      
    default:
      return [];
  }
}

export function hasSocialPermission(userRole: string | undefined, permission: SocialPermission): boolean {
  if (!userRole) return false;
  const permissions = getPermissionsForRole(userRole);
  return permissions.includes(permission) || permissions.includes(SOCIAL_PERMISSIONS.ADMIN);
}


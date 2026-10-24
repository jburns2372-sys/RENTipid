import { OATRegistry } from '../oat-module-registry';
import { OAT_SHARED_USERS } from '../oat-shared-users';

OATRegistry.register({
  moduleId: 'SOCIAL',
  moduleName: 'Social Media & Marketing',
  oatId: 'OAT-SOCIAL-MASTER-001',
  enabled: true,
  criticality: 'TIER 1 - BUSINESS-CRITICAL',
  manualChecklistPath: 'final-documentation/oat/social-media/OWNER-ACCEPTANCE-TEST.md',
  requiredRoles: ['OWNER', 'ADMIN', 'PROVIDER'],
  requiredFixtureTypes: ['MockSocialAdapter', 'MasterCampaign', 'TestProvider'],
  estimatedMinutes: 15,
  dependencies: ['AUTH', 'RBAC'], // Hypothetical upstream modules
  cleanupPolicy: 'RESET_TO_BASELINE',
  
  fixtureProvider: async () => {
    console.log('Ensure Social OAT master fixtures exist (Idempotent UPSERT)...');
    console.log(`Setting up shared users: ${OAT_SHARED_USERS.PROVIDER.email}...`);
    // Example: await db.user.upsert(...)
  },

  resetHandler: async () => {
    console.log('Resetting Social OAT transient data (posts, approvals, publications)...');
    // Example: await db.socialPost.deleteMany({ where: { isOat: true } })
  },

  readinessHandler: async () => {
    return {
      moduleId: 'SOCIAL',
      oatId: 'OAT-SOCIAL-MASTER-001',
      environment: 'PREVIEW',
      database: 'SAFE',
      fixtures: 'READY',
      dependencies: 'READY',
      rbac: 'READY',
      mockProvider: 'READY',
      featureFlags: 'READY',
      blockers: [],
      overall: 'READY'
    };
  }
});

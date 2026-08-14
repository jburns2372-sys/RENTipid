export type OATRole = 'OWNER' | 'ADMIN' | 'REVIEWER' | 'PROVIDER' | 'RENTER' | 'SUPER_ADMIN' | 'RESTRICTED';

export interface OATReadinessResult {
  moduleId: string;
  oatId: string;
  environment: 'PREVIEW' | 'INVALID';
  database: 'SAFE' | 'UNSAFE';
  fixtures: 'READY' | 'MISSING';
  dependencies: 'READY' | 'MISSING';
  rbac: 'READY' | 'FAILED';
  mockProvider: 'READY' | 'N/A' | 'FAILED';
  featureFlags: 'READY' | 'FAILED';
  blockers: string[];
  overall: 'READY' | 'NOT READY';
}

export interface OATModuleDefinition {
  moduleId: string;
  moduleName: string;
  oatId: string;
  enabled: boolean;
  criticality: 'TIER 0 - LAUNCH-CRITICAL' | 'TIER 1 - BUSINESS-CRITICAL' | 'TIER 2 - OPERATIONS / ENHANCEMENT';
  manualChecklistPath: string;
  requiredRoles: OATRole[];
  requiredFixtureTypes: string[];
  estimatedMinutes: number;
  dependencies: string[]; // array of moduleIds
  cleanupPolicy: 'ARCHIVE' | 'DELETE' | 'RESET_TO_BASELINE';

  fixtureProvider: () => Promise<void>;
  resetHandler: () => Promise<void>;
  readinessHandler: () => Promise<OATReadinessResult>;
}

class OATModuleRegistry {
  private modules: Map<string, OATModuleDefinition> = new Map();

  register(module: OATModuleDefinition) {
    if (this.modules.has(module.moduleId)) {
      throw new Error(`OAT Module with ID ${module.moduleId} is already registered.`);
    }
    
    const existingOatIds = Array.from(this.modules.values()).map(m => m.oatId);
    if (existingOatIds.includes(module.oatId)) {
        throw new Error(`OAT ID ${module.oatId} is already registered.`);
    }
    
    this.modules.set(module.moduleId, module);
  }

  get(moduleId: string): OATModuleDefinition | undefined {
    return this.modules.get(moduleId);
  }

  getAll(): OATModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  getEnabled(): OATModuleDefinition[] {
    return this.getAll().filter(m => m.enabled);
  }
}

export const OATRegistry = new OATModuleRegistry();

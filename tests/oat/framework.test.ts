import { OATRegistry } from '../../src/lib/oat/oat-module-registry';
import { assertSafeOatEnvironment } from '../../src/lib/oat/oat-environment-guard';

describe('OAT Framework Core', () => {
    
    describe('Environment Guard', () => {
        const originalEnv = process.env;

        beforeEach(() => {
            jest.resetModules();
            process.env = { ...originalEnv };
        });

        afterAll(() => {
            process.env = originalEnv;
        });

        it('should reject execution if NODE_ENV is production', () => {
            process.env.NODE_ENV = 'production';
            process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/rentipid_test_soc';
            expect(() => assertSafeOatEnvironment()).toThrow(/OAT_ENVIRONMENT_GUARD_REJECTED/);
        });

        it('should reject execution if VERCEL_ENV is production', () => {
            process.env.VERCEL_ENV = 'production';
            process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/rentipid_test_soc';
            expect(() => assertSafeOatEnvironment()).toThrow(/OAT_ENVIRONMENT_GUARD_REJECTED/);
        });

        it('should reject execution if DATABASE_URL is missing', () => {
            delete process.env.DATABASE_URL;
            expect(() => assertSafeOatEnvironment()).toThrow(/DATABASE_URL missing/);
        });

        it('should reject execution if DATABASE_URL points to Production Azure DB', () => {
            process.env.NODE_ENV = 'test';
            process.env.DATABASE_URL = 'postgresql://prod:secret@rentipid-postgres-db.postgres.database.azure.com:5432/rentipid_db';
            expect(() => assertSafeOatEnvironment()).toThrow(/Database identity matches Production Azure DB/);
        });

        it('should allow execution on local test database', () => {
            process.env.NODE_ENV = 'test';
            process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/rentipid_test_soc';
            expect(assertSafeOatEnvironment()).toBe(true);
        });
    });

    describe('Module Registry', () => {
        const mockModule = {
            moduleId: 'TEST',
            moduleName: 'Test Module',
            oatId: 'OAT-TEST-MASTER-001',
            enabled: true,
            criticality: 'TIER 2 - OPERATIONS / ENHANCEMENT' as const,
            manualChecklistPath: 'docs/oat.md',
            requiredRoles: [],
            requiredFixtureTypes: [],
            estimatedMinutes: 5,
            dependencies: [],
            cleanupPolicy: 'DELETE' as const,
            fixtureProvider: async () => {},
            resetHandler: async () => {},
            readinessHandler: async () => ({
                moduleId: 'TEST',
                oatId: 'OAT-TEST-MASTER-001',
                environment: 'PREVIEW' as const,
                database: 'SAFE' as const,
                fixtures: 'READY' as const,
                dependencies: 'READY' as const,
                rbac: 'READY' as const,
                mockProvider: 'READY' as const,
                featureFlags: 'READY' as const,
                blockers: [],
                overall: 'READY' as const
            })
        };

        it('should successfully register a valid module', () => {
            OATRegistry.register(mockModule);
            expect(OATRegistry.get('TEST')).toBeDefined();
        });

        it('should reject registration with duplicate moduleId', () => {
            expect(() => OATRegistry.register(mockModule)).toThrow(/is already registered/);
        });

        it('should reject registration with duplicate oatId', () => {
            const anotherMock = { ...mockModule, moduleId: 'TEST2' };
            expect(() => OATRegistry.register(anotherMock)).toThrow(/is already registered/);
        });
        
        it('should return undefined for unknown module', () => {
            expect(OATRegistry.get('UNKNOWN_MODULE')).toBeUndefined();
        });
    });
});

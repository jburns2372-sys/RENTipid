import { unifiedAiSpecialistOrchestrator } from '../../src/lib/ai/specialists/orchestrator';
import { executeMarketplaceAnalyticsQueryTool } from '../../src/lib/ai/tools/marketplace-registry';
import { MarketplaceAnalyticsAdapter, MarketplaceAnalyticsAdapterError } from '../../src/lib/ai/analytics/marketplace-analytics-adapter';
import { AiSpecialistRegistryError } from '../../src/lib/ai/specialists/registry';

describe('P4.2-MKT: MarketplaceIntelligenceSpecialist', () => {

  describe('Framework and Ownership Registration', () => {
    it('P4.2-MKT-01: should resolve marketplace_analytics intent to MarketplaceIntelligenceSpecialist', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('marketplace_analytics');
      expect(selection.definition.id).toBe('MarketplaceIntelligenceSpecialist');
      expect(selection.ownership.primarySpecialistId).toBe('MarketplaceIntelligenceSpecialist');
    });

    it('P4.2-MKT-02: should resolve operational_metrics intent to MarketplaceIntelligenceSpecialist', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('operational_metrics');
      expect(selection.definition.id).toBe('MarketplaceIntelligenceSpecialist');
      expect(selection.ownership.primarySpecialistId).toBe('MarketplaceIntelligenceSpecialist');
    });

    it('P4.2-MKT-03: should only allow Admin and Super Admin roles', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('marketplace_analytics');
      expect(selection.definition.allowedRoles).toContain('Admin');
      expect(selection.definition.allowedRoles).toContain('Super Admin');
      expect(selection.definition.allowedRoles).not.toContain('Guest');
      expect(selection.definition.allowedRoles).not.toContain('Renter');
    });
  });

  describe('Analytics Adapter Read-Only Enforcement (A-MKT-02)', () => {
    const maliciousQueries = [
      'UPDATE users SET role = "Admin" WHERE id = 1',
      'DELETE FROM bookings WHERE id = "abc"',
      'INSERT INTO logs (message) VALUES ("test")',
      'DROP TABLE users',
      'ALTER TABLE users ADD COLUMN password text',
      'TRUNCATE TABLE logs',
      'CREATE TABLE test (id int)',
      'GRANT ALL PRIVILEGES ON DATABASE to admin',
      'REVOKE ALL ON users FROM admin',
      'COPY users TO "/tmp/data"',
      'CALL some_procedure()',
      'EXEC xp_cmdshell("dir")',
      'SELECT * FROM pg_catalog.pg_tables',
      'SELECT * FROM information_schema.tables',
      'SELECT * FROM pg_shadow',
      'SELECT * FROM bookings; DROP TABLE users'
    ];

    maliciousQueries.forEach((query, index) => {
      it(`P4.2-MKT-04-${index}: should reject query: ${query.substring(0, 30)}...`, () => {
        expect(() => MarketplaceAnalyticsAdapter.validateQuery(query))
          .toThrow(MarketplaceAnalyticsAdapterError);
      });
    });

    it('P4.2-MKT-05: should allow a basic SELECT query', () => {
      expect(() => MarketplaceAnalyticsAdapter.validateQuery('SELECT count(*) FROM users'))
        .not.toThrow();
    });

    it('P4.2-MKT-06: should allow a WITH ... SELECT query', () => {
      expect(() => MarketplaceAnalyticsAdapter.validateQuery('WITH cte AS (SELECT * FROM users) SELECT * FROM cte'))
        .not.toThrow();
    });
  });

  describe('Tool Registry', () => {
    it('P4.2-MKT-07: execute_marketplace_analytics_query tool rejects write operations via handler', async () => {
      const context = { userId: 'admin1', userRole: 'Admin' };
      await expect(
        executeMarketplaceAnalyticsQueryTool.handler(
          { sql: 'UPDATE users SET role="Super Admin"' },
          context as any
        )
      ).rejects.toThrow(AiSpecialistRegistryError);
    });

    it('P4.2-MKT-08: execute_marketplace_analytics_query tool enforces Admin roles', async () => {
      const context = { userId: 'renter1', userRole: 'Renter' };
      await expect(
        executeMarketplaceAnalyticsQueryTool.handler(
          { sql: 'SELECT * FROM users' },
          context as any
        )
      ).rejects.toThrow(AiSpecialistRegistryError);
    });
  });

});

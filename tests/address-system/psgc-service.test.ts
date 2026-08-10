import { PsgcService } from '../../src/lib/address/psgc/psgc-service';
import { prisma } from '../../src/lib/prisma';

describe('PSGC Service', () => {
  // We assume the DB is already populated via psgc-sync script before tests run

  describe('resolveCityByName', () => {
    it('should resolve Quezon City to 1381300000', async () => {
      const res = await PsgcService.resolveCityByName('Quezon City');
      expect(res.resolved).toBe(true);
      expect(res.psgcCode).toBe('1381300000');
      expect(res.canonicalName).toBe('Quezon City');
    });

    it('should handle "City of" prefix', async () => {
      const res = await PsgcService.resolveCityByName('City of Manila');
      expect(res.resolved).toBe(true);
      expect(res.psgcCode).toBe('1380600000'); // Manila
    });

    it('should resolve Cebu City', async () => {
      const res = await PsgcService.resolveCityByName('Cebu City');
      expect(res.resolved).toBe(true);
      expect(res.psgcCode).toBe('0730600000'); // Cebu City
    });

    it('should resolve Davao City', async () => {
      const res = await PsgcService.resolveCityByName('Davao City');
      expect(res.resolved).toBe(true);
      expect(res.psgcCode).toBe('1130700000'); // Davao City
    });

    it('should resolve Makati City (NCR no-province)', async () => {
      const res = await PsgcService.resolveCityByName('Makati');
      expect(res.resolved).toBe(true);
      expect(res.psgcCode).toBe('1380300000'); // Makati City
    });

    it('should return unresolved for invalid city', async () => {
      const res = await PsgcService.resolveCityByName('Fake City XZY');
      expect(res.resolved).toBe(false);
    });
  });

  describe('getBarangaysByCityCode', () => {
    it('should return exactly 142 barangays for Quezon City', async () => {
      const barangays = await PsgcService.getBarangaysByCityCode('1381300000');
      expect(barangays.length).toBe(142);
      // Pick one known barangay to verify
      const hasBatasan = barangays.some(b => b.name === 'Batasan Hills');
      expect(hasBatasan).toBe(true);
    });
  });

  describe('autoMatchBarangay', () => {
    it('should exactly match a Google barangay name', async () => {
      // Quezon City
      const match = await PsgcService.autoMatchBarangay('Batasan Hills', '1381300000');
      expect(match).toBe('1381300139'); // Known PSGC for Batasan Hills
    });

    it('should handle "Barangay" prefix', async () => {
      const match = await PsgcService.autoMatchBarangay('Barangay Batasan Hills', '1381300000');
      expect(match).toBe('1381300139');
    });

    it('should return null for unmatched barangay', async () => {
      const match = await PsgcService.autoMatchBarangay('Fake Barangay XYZ', '1381300000');
      expect(match).toBeNull();
    });
  });

  describe('validateBarangayBelongsToCity', () => {
    it('should return true for valid pair', async () => {
      const isValid = await PsgcService.validateBarangayBelongsToCity('1381300139', '1381300000');
      expect(isValid).toBe(true);
    });

    it('should return false for cross-city injection (QC barangay in Manila)', async () => {
      // Manila code with QC barangay
      const isValid = await PsgcService.validateBarangayBelongsToCity('1381300139', '1380600000');
      expect(isValid).toBe(false);
    });

    it('should return false for invalid PSGC code', async () => {
      const isValid = await PsgcService.validateBarangayBelongsToCity('9999999999', '1381300000');
      expect(isValid).toBe(false);
    });
  });
});

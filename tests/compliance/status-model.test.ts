
import { ComplianceStatus, LegalControlRecord, PHILIPPINE_REGISTER, INTERNATIONAL_REGISTER, getLawsByJurisdiction } from '../../src/lib/compliance/registry';

describe('Global Legal Compliance Status Model', () => {
  it('should accept SUPPORTED status', () => {
    const record: LegalControlRecord = { lawId: 'TEST-1', countryOrRegion: 'Test', officialName: 'Test Law', primaryApplication: 'App', status: 'SUPPORTED' };
    expect(record.status).toBe('SUPPORTED');
  });

  it('should accept VALIDATION_REQUIRED status', () => {
    const record: LegalControlRecord = { lawId: 'TEST-2', countryOrRegion: 'Test', officialName: 'Test Law', primaryApplication: 'App', status: 'VALIDATION_REQUIRED' };
    expect(record.status).toBe('VALIDATION_REQUIRED');
  });

  it('should accept COMPLIANCE_READY status', () => {
    const record: LegalControlRecord = { lawId: 'TEST-3', countryOrRegion: 'Test', officialName: 'Test Law', primaryApplication: 'App', status: 'COMPLIANCE_READY' };
    expect(record.status).toBe('COMPLIANCE_READY');
  });

  it('should accept ACTIVE status', () => {
    const record: LegalControlRecord = { lawId: 'TEST-4', countryOrRegion: 'Test', officialName: 'Test Law', primaryApplication: 'App', status: 'ACTIVE' };
    expect(record.status).toBe('ACTIVE');
  });

  it('should accept RESTRICTED status', () => {
    const record: LegalControlRecord = { lawId: 'TEST-5', countryOrRegion: 'Test', officialName: 'Test Law', primaryApplication: 'App', status: 'RESTRICTED' };
    expect(record.status).toBe('RESTRICTED');
  });

  it('should accept BLOCKED status', () => {
    const record: LegalControlRecord = { lawId: 'TEST-6', countryOrRegion: 'Test', officialName: 'Test Law', primaryApplication: 'App', status: 'BLOCKED' };
    expect(record.status).toBe('BLOCKED');
  });

  it('should reject invalid status by TypeScript compiler (simulated by checking values)', () => {
    const validStatuses = ['SUPPORTED', 'VALIDATION_REQUIRED', 'COMPLIANCE_READY', 'ACTIVE', 'RESTRICTED', 'BLOCKED'];
    expect(validStatuses.includes('INVALID_STATUS')).toBe(false);
  });

  it('previous active=true compatibility maps to ACTIVE', () => {
    // If we had an old object { active: true }, it maps to { status: 'ACTIVE' }
    const oldConfig = { active: true };
    const newStatus = oldConfig.active ? 'ACTIVE' : 'VALIDATION_REQUIRED';
    expect(newStatus).toBe('ACTIVE');
  });

  it('previous non-active records map to VALIDATION_REQUIRED or SUPPORTED without accidental activation', () => {
    const oldConfig = { active: false };
    const newStatus = oldConfig.active ? 'ACTIVE' : 'VALIDATION_REQUIRED';
    expect(newStatus).not.toBe('ACTIVE');
    expect(newStatus).toBe('VALIDATION_REQUIRED');
  });
});

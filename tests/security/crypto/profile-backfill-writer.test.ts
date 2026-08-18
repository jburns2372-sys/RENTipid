import { ProfileBackfillWriter } from '../../../src/lib/security/crypto/profile-backfill-writer';
import { PrismaClient } from '@prisma/client';
import { KeyProvider, KeyPurpose } from '../../../src/lib/security/crypto/key-provider';
import { ProfileFieldProtection, ProfileFieldContext } from '../../../src/lib/security/crypto/profile-field-protection';
import { ProfileBackfillRecordOutcome, ProfileBackfillLockOutcome, ProfileBackfillStructuredWriteResult } from '../../../src/lib/security/crypto/profile-backfill-types';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        $queryRaw: jest.fn(),
        $disconnect: jest.fn(),
        $transaction: jest.fn(),
        userProfile: {
          findUnique: jest.fn(),
          updateMany: jest.fn(),
        },
        businessProfile: {
          findUnique: jest.fn(),
          updateMany: jest.fn(),
        }
      };
    })
  };
});

describe('ProfileBackfillWriter Unit Tests', () => {
  let writer: ProfileBackfillWriter;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    writer = new ProfileBackfillWriter(mockPrisma, () => Promise.resolve());
    
    // Inject mock into lockPrisma for testing
    Object.defineProperty(writer, 'lockPrisma', { value: mockPrisma, writable: true });

    jest.spyOn(KeyProvider, 'getActiveKey').mockReturnValue({ id: 'test-key-v1' } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('14. Lock acquired before write', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ pg_try_advisory_lock: true }]);
    const res = await writer.acquireLock();
    expect(res).toBe(ProfileBackfillLockOutcome.LOCK_ACQUIRED);
  });

  it('15. Lock already held prevents writes', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ pg_try_advisory_lock: false }]);
    const res = await writer.acquireLock();
    expect(res).toBe(ProfileBackfillLockOutcome.LOCK_ALREADY_HELD);
  });

  it('16. Lock released in success', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ pg_advisory_unlock: true }]);
    const res = await writer.releaseLock();
    expect(res).toBe(ProfileBackfillLockOutcome.LOCK_RELEASED);
  });

  it('17. Lock released after failure', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('fail'));
    const res = await writer.releaseLock();
    expect(res).toBe(ProfileBackfillLockOutcome.LOCK_RELEASE_FAILED);
  });

  it('12. Key pinned before writes', () => {
    const v = writer.pinKeyVersion();
    expect(v).toBe('test-key-v1');
  });

  it('13. Key-version change fails run', async () => {
    writer.pinKeyVersion();
    jest.spyOn(KeyProvider, 'getActiveKey').mockReturnValue({ id: 'test-key-v2' } as any);
    await expect(writer.processUserProfile('1')).rejects.toThrow('Key version changed during run');
  });

  it('1. User legacy-only success', async () => {
    writer.pinKeyVersion();
    
    const legacyRec = { id: '1', address: '123 Main', address_encrypted: null };
    
    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      mockPrisma.userProfile.findUnique.mockResolvedValueOnce(legacyRec).mockResolvedValueOnce(legacyRec);
      mockPrisma.userProfile.updateMany.mockResolvedValue({ count: 1 });
      return cb(mockPrisma);
    });

    const envelope = JSON.stringify({ keyId: 'test-key-v1', value: 'enc-val' });
    jest.spyOn(ProfileFieldProtection, 'protect').mockReturnValue(envelope);
    jest.spyOn(ProfileFieldProtection, 'read').mockReturnValue({ value: '123 Main', source: 'ENCRYPTED' } as any);

    const res = await writer.processUserProfile('1');
    expect(res.outcome).toBe(ProfileBackfillRecordOutcome.BACKFILLED);
    expect(res.fieldsBackfilled).toBe(1);
  });

  it('3. User conditional count zero', async () => {
    writer.pinKeyVersion();
    const legacyRec = { id: '1', address: '123 Main', address_encrypted: null };
    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      mockPrisma.userProfile.findUnique.mockResolvedValueOnce(legacyRec);
      mockPrisma.userProfile.updateMany.mockResolvedValue({ count: 0 });
      return cb(mockPrisma);
    });

    const envelope = JSON.stringify({ keyId: 'test-key-v1', value: 'enc-val' });
    jest.spyOn(ProfileFieldProtection, 'protect').mockReturnValue(envelope);
    const res = await writer.processUserProfile('1');
    expect(res.outcome).toBe(ProfileBackfillRecordOutcome.SKIPPED_CONCURRENT_CHANGE);
  });

  it('4. User count greater than one', async () => {
    writer.pinKeyVersion();
    const legacyRec = { id: '1', address: '123 Main', address_encrypted: null };
    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      mockPrisma.userProfile.findUnique.mockResolvedValueOnce(legacyRec);
      mockPrisma.userProfile.updateMany.mockResolvedValue({ count: 2 });
      return cb(mockPrisma);
    });

    const envelope = JSON.stringify({ keyId: 'test-key-v1', value: 'enc-val' });
    jest.spyOn(ProfileFieldProtection, 'protect').mockReturnValue(envelope);
    await expect(writer.processUserProfile('1')).rejects.toThrow('Invariant violation: update count > 1');
  });

  it('18. Retryable failure retries at most three times total (2 retries)', async () => {
    writer.pinKeyVersion();
    mockPrisma.$transaction.mockRejectedValue(new Error('database deadlock detected'));
    
    await expect(writer.processUserProfile('1')).rejects.toThrow('database deadlock detected');
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(3);
  });
  
  it('19. Non-retryable failure does not retry', async () => {
    writer.pinKeyVersion();
    mockPrisma.$transaction.mockRejectedValue(new Error('Invariant violation'));
    await expect(writer.processUserProfile('1')).rejects.toThrow('Invariant violation');
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('7. Business one-field eligible', async () => {
    writer.pinKeyVersion();
    const bRec = { id: '1', business_address: 'Addr', business_address_encrypted: null, business_registration_number: 'Reg', business_registration_number_encrypted: 'EncReg' };
    
    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      mockPrisma.businessProfile.findUnique.mockResolvedValueOnce(bRec).mockResolvedValueOnce(bRec);
      mockPrisma.businessProfile.updateMany.mockResolvedValue({ count: 1 });
      return cb(mockPrisma);
    });

    const envelope = JSON.stringify({ keyId: 'test-key-v1', value: 'enc-val' });
    jest.spyOn(ProfileFieldProtection, 'protect').mockReturnValue(envelope);
    jest.spyOn(ProfileFieldProtection, 'read').mockImplementation((enc: any, leg: any, ctx: any) => {
      if (ctx === ProfileFieldContext.BUSINESS_ADDRESS) return { value: 'Addr', source: 'ENCRYPTED' } as any;
      return { value: 'Reg', source: 'ENCRYPTED' } as any; 
    });

    const res = await writer.processBusinessProfile('1');
    expect(res.outcome).toBe(ProfileBackfillRecordOutcome.BACKFILLED);
    expect(res.fieldsBackfilled).toBe(1);
  });

  it('8. Business both fields eligible', async () => {
    writer.pinKeyVersion();
    const bRec = { id: '1', business_address: 'Addr', business_address_encrypted: null, business_registration_number: 'Reg', business_registration_number_encrypted: null };
    
    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      mockPrisma.businessProfile.findUnique.mockResolvedValueOnce(bRec).mockResolvedValueOnce(bRec);
      mockPrisma.businessProfile.updateMany.mockResolvedValue({ count: 1 });
      return cb(mockPrisma);
    });

    const envelope = JSON.stringify({ keyId: 'test-key-v1', value: 'enc-val' });
    jest.spyOn(ProfileFieldProtection, 'protect').mockReturnValue(envelope);
    jest.spyOn(ProfileFieldProtection, 'read').mockImplementation((enc: any, leg: any, ctx: any) => {
      if (ctx === ProfileFieldContext.BUSINESS_ADDRESS) return { value: 'Addr', source: 'ENCRYPTED' } as any;
      if (ctx === ProfileFieldContext.BUSINESS_REGISTRATION_NUMBER) return { value: 'Reg', source: 'ENCRYPTED' } as any;
      return { value: null, source: 'ABSENT' } as any;
    });

    const res = await writer.processBusinessProfile('1');
    expect(res.outcome).toBe(ProfileBackfillRecordOutcome.BACKFILLED);
    expect(res.fieldsBackfilled).toBe(2);
  });
});

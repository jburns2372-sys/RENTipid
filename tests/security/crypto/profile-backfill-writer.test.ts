import { ProfileBackfillWriter } from '../../../src/lib/security/crypto/profile-backfill-writer';
import { PrismaClient } from '@prisma/client';
import { KeyProvider, KeyPurpose } from '../../../src/lib/security/crypto/key-provider';
import { ProfileFieldProtection, ProfileFieldContext } from '../../../src/lib/security/crypto/profile-field-protection';
import { ProfileBackfillRecordOutcome, ProfileBackfillLockOutcome } from '../../../src/lib/security/crypto/profile-backfill-types';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        $queryRawUnsafe: jest.fn(),
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
  let mockPrisma: unknown;
  let mockLockPrisma: unknown;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    mockLockPrisma = new PrismaClient();
    writer = new ProfileBackfillWriter(mockPrisma, mockLockPrisma, () => Promise.resolve());
    
    jest.spyOn(KeyProvider, 'getActiveKey').mockReturnValue({ id: 'test-key-v1' } as unknown as Record<string, unknown>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('14. Lock acquired before write', async () => {
    mockLockPrisma.$queryRawUnsafe.mockResolvedValue([{ pg_try_advisory_lock: true }]);
    const res = await writer.acquireLock();
    expect(res).toBe(ProfileBackfillLockOutcome.LOCK_ACQUIRED);
  });

  it('15. Lock already held prevents writes', async () => {
    mockLockPrisma.$queryRawUnsafe.mockResolvedValue([{ pg_try_advisory_lock: false }]);
    const res = await writer.acquireLock();
    expect(res).toBe(ProfileBackfillLockOutcome.LOCK_ALREADY_HELD);
  });

  it('16. Lock released in success', async () => {
    mockLockPrisma.$queryRawUnsafe.mockResolvedValue([{ pg_advisory_unlock: true }]);
    const res = await writer.releaseLock();
    expect(res).toBe(ProfileBackfillLockOutcome.LOCK_RELEASED);
  });

  it('17. Lock released after failure', async () => {
    mockLockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('fail'));
    const res = await writer.releaseLock();
    expect(res).toBe(ProfileBackfillLockOutcome.LOCK_RELEASE_FAILED);
  });

  it('12. Key pinned before writes', () => {
    const v = writer.pinKeyVersion();
    expect(v).toBe('test-key-v1');
  });

  it('13. Key-version change fails run', async () => {
    writer.pinKeyVersion();
    jest.spyOn(KeyProvider, 'getActiveKey').mockReturnValue({ id: 'test-key-v2' } as unknown as Record<string, unknown>);
    await expect(writer.processUserProfile('1')).rejects.toThrow('Key version changed during run');
  });

  it('1. User legacy-only success', async () => {
    writer.pinKeyVersion();
    
    const legacyRec = { id: '1', address: '123 Main', address_encrypted: null };
    
    mockPrisma.$transaction.mockImplementation(async (cb: unknown) => {
      mockPrisma.userProfile.findUnique.mockResolvedValueOnce(legacyRec).mockResolvedValueOnce(legacyRec);
      mockPrisma.userProfile.updateMany.mockResolvedValue({ count: 1 });
      return cb(mockPrisma);
    });

    jest.spyOn(ProfileFieldProtection, 'protect').mockReturnValue('enc-val');
    jest.spyOn(ProfileFieldProtection, 'read').mockReturnValue({ value: '123 Main', source: 'ENCRYPTED' } as unknown as Record<string, unknown>);

    const res = await writer.processUserProfile('1');
    expect(res).toBe(ProfileBackfillRecordOutcome.BACKFILLED);
  });

  it('3. User conditional count zero', async () => {
    writer.pinKeyVersion();
    const legacyRec = { id: '1', address: '123 Main', address_encrypted: null };
    mockPrisma.$transaction.mockImplementation(async (cb: unknown) => {
      mockPrisma.userProfile.findUnique.mockResolvedValueOnce(legacyRec);
      mockPrisma.userProfile.updateMany.mockResolvedValue({ count: 0 });
      return cb(mockPrisma);
    });

    jest.spyOn(ProfileFieldProtection, 'protect').mockReturnValue('enc-val');
    const res = await writer.processUserProfile('1');
    expect(res).toBe(ProfileBackfillRecordOutcome.SKIPPED_CONCURRENT_CHANGE);
  });

  it('4. User count greater than one', async () => {
    writer.pinKeyVersion();
    const legacyRec = { id: '1', address: '123 Main', address_encrypted: null };
    mockPrisma.$transaction.mockImplementation(async (cb: unknown) => {
      mockPrisma.userProfile.findUnique.mockResolvedValueOnce(legacyRec);
      mockPrisma.userProfile.updateMany.mockResolvedValue({ count: 2 });
      return cb(mockPrisma);
    });

    jest.spyOn(ProfileFieldProtection, 'protect').mockReturnValue('enc-val');
    await expect(writer.processUserProfile('1')).rejects.toThrow('Invariant violation: update count > 1');
  });

  it('18. Retryable failure retries at most three times', async () => {
    writer.pinKeyVersion();
    mockPrisma.$transaction.mockRejectedValue(new Error('database deadlock detected'));
    
    await expect(writer.processUserProfile('1')).rejects.toThrow('database deadlock detected');
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(4);
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
    
    mockPrisma.$transaction.mockImplementation(async (cb: unknown) => {
      mockPrisma.businessProfile.findUnique.mockResolvedValueOnce(bRec).mockResolvedValueOnce(bRec);
      mockPrisma.businessProfile.updateMany.mockResolvedValue({ count: 1 });
      return cb(mockPrisma);
    });

    jest.spyOn(ProfileFieldProtection, 'protect').mockReturnValue('enc-addr');
    jest.spyOn(ProfileFieldProtection, 'read').mockImplementation((enc: unknown, leg: unknown, ctx: unknown) => {
      if (ctx === ProfileFieldContext.BUSINESS_ADDRESS) return { value: 'Addr', source: 'ENCRYPTED' } as unknown as import("../../../src/lib/security/crypto/profile-field-protection").ReadProtectedResult;
      return { value: 'Reg', source: 'ENCRYPTED' } as unknown as import("../../../src/lib/security/crypto/profile-field-protection").ReadProtectedResult; 
    });

    const res = await writer.processBusinessProfile('1');
    expect(res).toBe(ProfileBackfillRecordOutcome.BACKFILLED);
  });

  it('8. Business both fields eligible', async () => {
    writer.pinKeyVersion();
    const bRec = { id: '1', business_address: 'Addr', business_address_encrypted: null, business_registration_number: 'Reg', business_registration_number_encrypted: null };
    
    mockPrisma.$transaction.mockImplementation(async (cb: unknown) => {
      mockPrisma.businessProfile.findUnique.mockResolvedValueOnce(bRec).mockResolvedValueOnce(bRec);
      mockPrisma.businessProfile.updateMany.mockResolvedValue({ count: 1 });
      return cb(mockPrisma);
    });

    jest.spyOn(ProfileFieldProtection, 'protect').mockReturnValue('enc');
    jest.spyOn(ProfileFieldProtection, 'read').mockImplementation((enc: unknown, leg: unknown, ctx: unknown) => {
      if (ctx === ProfileFieldContext.BUSINESS_ADDRESS) return { value: 'Addr', source: 'ENCRYPTED' } as unknown as import("../../../src/lib/security/crypto/profile-field-protection").ReadProtectedResult;
      if (ctx === ProfileFieldContext.BUSINESS_REGISTRATION_NUMBER) return { value: 'Reg', source: 'ENCRYPTED' } as unknown as import("../../../src/lib/security/crypto/profile-field-protection").ReadProtectedResult;
      return { value: null, source: 'ABSENT' } as unknown as import("../../../src/lib/security/crypto/profile-field-protection").ReadProtectedResult;
    });

    const res = await writer.processBusinessProfile('1');
    expect(res).toBe(ProfileBackfillRecordOutcome.BACKFILLED);
  });
});



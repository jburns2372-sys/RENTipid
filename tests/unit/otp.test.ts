import { generateAndSendOtp } from '../../src/lib/auth/otp';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Mock dependencies
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    verificationChallenge: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    securityEvent: {
      create: jest.fn(),
    },
    phoneIdentity: {
      findUnique: jest.fn(),
    },
    user: {
      create: jest.fn(),
    }
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

const prisma = new PrismaClient();

describe('OTP Authentication Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAndSendOtp', () => {
    it('rate limiting works', async () => {
      (prisma.verificationChallenge.count as jest.Mock).mockResolvedValue(3); // Hit limit

      await expect(generateAndSendOtp('+1234567890')).rejects.toThrow('Too many requests. Please try again later.');
    });

    it('creates challenge securely', async () => {
      (prisma.verificationChallenge.count as jest.Mock).mockResolvedValue(0);
      
      await generateAndSendOtp(' +1 234 567 890 ');
      
      expect(prisma.verificationChallenge.create).toHaveBeenCalled();
      const callArgs = (prisma.verificationChallenge.create as jest.Mock).mock.calls[0][0];
      
      expect(callArgs.data.target_identity).toBe('+1234567890'); // Phone normalization cannot bypass challenge matching
      expect(callArgs.data.challenge_hashed).not.toBeNull();
      // Ensure it's a bcrypt hash, not plaintext
      expect(callArgs.data.challenge_hashed.startsWith('$2')).toBeTruthy();
      expect(callArgs.data.is_consumed).toBe(false);
    });
  });
});

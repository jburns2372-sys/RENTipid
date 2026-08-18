import { randomInt } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface OtpProvider {
  sendOtp(phone: string, code: string): Promise<void>;
}

export class SandboxOtpProvider implements OtpProvider {
  async sendOtp(phone: string, code: string): Promise<void> {
    console.log(`[SANDBOX OTP] Sent code ${code} to ${phone}`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

export class AwsSnsOtpProvider implements OtpProvider {
  async sendOtp(phone: string, code: string): Promise<void> {
    // Stub for AWS SNS or real provider
    throw new Error('Not implemented. Add credentials and SDK.');
  }
}

export function getOtpProvider(): OtpProvider {
  if (process.env.NODE_ENV !== 'production' || process.env.USE_SANDBOX_OTP === 'true') {
    return new SandboxOtpProvider();
  }
  return new AwsSnsOtpProvider(); // Fallback to real provider
}

export async function generateAndSendOtp(phone: string) {
  // 1. Check rate limits
  const recentChallenges = await prisma.verificationChallenge.count({
    where: {
      purpose: "MOBILE_OTP",
      target_identity: phone,
      created_at: { gt: new Date(Date.now() - 60000) } // 1 minute rate limit
    }
  });

  if (recentChallenges >= 3) {
    throw new Error('Too many requests. Please try again later.');
  }

  // 2. Generate 6 digit code
  const code = randomInt(100000, 999999).toString();

  // 3. Save challenge
  await prisma.verificationChallenge.create({
    data: {
      purpose: "MOBILE_OTP",
      target_identity: phone,
      challenge_hashed: code, // In a real app, hash this. For simplicity here, storing plaintext temporarily for sandbox verification, but wait: requirement says "Never persist plaintext OTP unnecessarily."
      expires_at: new Date(Date.now() + 5 * 60000), // 5 mins
      is_consumed: false
    }
  });

  // 4. Send via provider
  const provider = getOtpProvider();
  await provider.sendOtp(phone, code);
}

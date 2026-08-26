import "server-only";
import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashSessionIdentifier, isTrustedSessionIdentifier } from "./session-key";
import { getActiveSessionByHash } from "@/lib/auth/session-registry";

export const MFA_SESSION_ASSURANCE_LEVEL_AAL2 = "AAL2";
export const MFA_SESSION_ASSURANCE_TTL_MS = 4 * 60 * 60 * 1000;

export class MfaSessionAssuranceRequiredError extends Error {
  constructor() {
    super("MFA_SESSION_AAL2_REQUIRED");
    this.name = "MfaSessionAssuranceRequiredError";
  }
}

export interface CurrentSessionBinding {
  userId: string;
  sessionKeyHash: string;
  tokenExpiresAt: Date | null;
}

export interface CurrentSessionAal2 {
  userId: string;
  assuranceLevel: typeof MFA_SESSION_ASSURANCE_LEVEL_AAL2;
  verifiedAt: Date;
  expiresAt: Date;
}

function getSessionUserId(session: unknown): string | null {
  if (
    session &&
    typeof session === "object" &&
    "user" in session &&
    session.user &&
    typeof session.user === "object" &&
    "id" in session.user &&
    typeof (session.user as { id?: unknown }).id === "string"
  ) {
    const userId = (session.user as { id: string }).id.trim();
    return userId === "" ? null : userId;
  }
  return null;
}

function getTrustedMfaSessionId(token: JWT): string | null {
  if (typeof token.mfaSessionId !== "string") {
    return null;
  }

  const sessionId = token.mfaSessionId.trim();
  if (!isTrustedSessionIdentifier(sessionId)) {
    return null;
  }

  return sessionId;
}

function resolveTokenExpiresAt(token: JWT): Date | null | false {
  if (!("exp" in token)) {
    return null;
  }

  if (typeof token.exp !== "number" || !Number.isFinite(token.exp)) {
    return false;
  }

  const expiresAt = new Date(token.exp * 1000);
  if (expiresAt.getTime() <= Date.now()) {
    return false;
  }

  return expiresAt;
}

async function getServerJwt(): Promise<JWT | null> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const secret = typeof authOptions.secret === "string" ? authOptions.secret : undefined;

  return getToken({
    req: {
      cookies: cookieStore,
      headers: headerStore,
    } as unknown as Parameters<typeof getToken>[0]["req"],
    secret,
  });
}

function getAssuranceExpiresAt(now: Date, tokenExpiresAt: Date | null): Date | null {
  const ttlExpiresAt = new Date(now.getTime() + MFA_SESSION_ASSURANCE_TTL_MS);
  const expiresAt =
    tokenExpiresAt && tokenExpiresAt.getTime() < ttlExpiresAt.getTime()
      ? tokenExpiresAt
      : ttlExpiresAt;

  return expiresAt.getTime() <= now.getTime() ? null : expiresAt;
}

export async function resolveCurrentSessionBinding(): Promise<CurrentSessionBinding | null> {
  try {
    const session = await getServerSession(authOptions);
    const userId = getSessionUserId(session);
    if (!userId) {
      return null;
    }

    const token = await getServerJwt();
    if (!token) {
      return null;
    }

    if (typeof token.id !== "string" || token.id !== userId) {
      return null;
    }

    const sessionId = getTrustedMfaSessionId(token);
    if (!sessionId) {
      return null;
    }

    const tokenExpiresAt = resolveTokenExpiresAt(token);
    if (tokenExpiresAt === false) {
      return null;
    }

    const binding = {
      userId,
      sessionKeyHash: hashSessionIdentifier(sessionId),
      tokenExpiresAt,
    };
    if (!(await getActiveSessionByHash(binding.userId, binding.sessionKeyHash))) return null;
    return binding;
  } catch {
    return null;
  }
}

export async function grantCurrentSessionAal2(options: { factorId?: string | null } = {}): Promise<boolean> {
  const binding = await resolveCurrentSessionBinding();
  if (!binding) {
    return false;
  }

  const now = new Date();
  const expiresAt = getAssuranceExpiresAt(now, binding.tokenExpiresAt);
  if (!expiresAt) {
    return false;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.mfaSessionAssurance.findUnique({
        where: { session_key_hash: binding.sessionKeyHash },
      });

      if (existing && existing.user_id !== binding.userId) {
        throw new Error("MFA_SESSION_ASSURANCE_USER_MISMATCH");
      }

      const data = {
        user_id: binding.userId,
        assurance_level: MFA_SESSION_ASSURANCE_LEVEL_AAL2,
        verified_at: now,
        expires_at: expiresAt,
        revoked_at: null,
        factor_id: options.factorId ?? null,
      };

      if (existing) {
        await tx.mfaSessionAssurance.update({
          where: { id: existing.id },
          data,
        });
        return;
      }

      await tx.mfaSessionAssurance.create({
        data: {
          session_key_hash: binding.sessionKeyHash,
          ...data,
        },
      });
    });

    return true;
  } catch {
    console.error("MFA session assurance grant failed");
    return false;
  }
}

export async function getCurrentSessionAal2(): Promise<CurrentSessionAal2 | null> {
  const binding = await resolveCurrentSessionBinding();
  if (!binding) {
    return null;
  }

  try {
    const record = await prisma.mfaSessionAssurance.findUnique({
      where: { session_key_hash: binding.sessionKeyHash },
    });

    if (!record) {
      return null;
    }

    if (record.user_id !== binding.userId) {
      return null;
    }

    if (record.assurance_level !== MFA_SESSION_ASSURANCE_LEVEL_AAL2) {
      return null;
    }

    if (record.revoked_at) {
      return null;
    }

    const now = Date.now();
    if (record.expires_at.getTime() <= now) {
      return null;
    }

    if (binding.tokenExpiresAt && binding.tokenExpiresAt.getTime() <= now) {
      return null;
    }

    if (binding.tokenExpiresAt && record.expires_at.getTime() > binding.tokenExpiresAt.getTime()) {
      return null;
    }

    return {
      userId: record.user_id,
      assuranceLevel: MFA_SESSION_ASSURANCE_LEVEL_AAL2,
      verifiedAt: record.verified_at,
      expiresAt: record.expires_at,
    };
  } catch {
    return null;
  }
}

export async function requireCurrentSessionAal2(): Promise<CurrentSessionAal2> {
  const assurance = await getCurrentSessionAal2();
  if (!assurance) {
    throw new MfaSessionAssuranceRequiredError();
  }
  return assurance;
}

export async function revokeCurrentSessionAal2(): Promise<boolean> {
  const binding = await resolveCurrentSessionBinding();
  if (!binding) {
    return false;
  }

  try {
    await prisma.mfaSessionAssurance.updateMany({
      where: {
        session_key_hash: binding.sessionKeyHash,
        user_id: binding.userId,
        revoked_at: null,
      },
      data: { revoked_at: new Date() },
    });
    return true;
  } catch {
    console.error("MFA session assurance revoke failed");
    return false;
  }
}

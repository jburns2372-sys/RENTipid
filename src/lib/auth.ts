import { NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import AppleProvider from "next-auth/providers/apple";
import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { logAuthenticationEvent } from "./security/events/writers/authentication-writer";
import { getActiveSessionByHash, registerUserSession } from "./auth/session-registry";
import { hashSessionIdentifier, isTrustedSessionIdentifier } from "./security/auth/session-key";
import { MFA_SESSION_ASSURANCE_LEVEL_AAL2 } from "./security/auth/mfa-session-assurance";
import type { OAuthAuthMethod } from "./auth/unified/config";
import { getUnifiedAuthConfig, isPublicAuthMethodEnabled } from "./auth/unified/config";
import { readOAuthConsent } from "./auth/unified/oauth-consent";
import { createPhoneOtpAuthenticationService, createUnifiedAuthenticationService } from "./auth/unified/factory";
import { UnifiedAuthError } from "./auth/unified/services";

function generateMfaSessionId(): string {
  return randomBytes(32).toString("base64url");
}

function requestHeader(req: unknown, name: string): string | undefined {
  const headers = (req as { headers?: Record<string, string | string[] | undefined> })?.headers;
  const value = headers?.[name] || headers?.[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}

function isAccepted(value: unknown): boolean {
  return value === true || value === "true" || value === "1" || value === "on";
}

function asOAuthProvider(provider: string | undefined): OAuthAuthMethod | null {
  if (provider === "google" || provider === "facebook" || provider === "apple") return provider;
  return null;
}

function mapUnifiedUser(user: {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.full_name,
    role: user.role,
    status: user.status,
  };
}

async function resolveCurrentOAuthLinkContext(): Promise<{ userId: string; hasAal2: boolean } | null> {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const secret = typeof authOptions.secret === "string" ? authOptions.secret : undefined;
    const token = await getToken({
      req: {
        cookies: cookieStore,
        headers: headerStore,
      } as unknown as Parameters<typeof getToken>[0]["req"],
      secret,
    });
    if (!token || typeof token.id !== "string" || !isTrustedSessionIdentifier(token.mfaSessionId)) return null;

    const sessionKeyHash = hashSessionIdentifier(token.mfaSessionId);
    const activeSession = await getActiveSessionByHash(token.id, sessionKeyHash);
    if (!activeSession) return null;

    const assurance = await prisma.mfaSessionAssurance.findUnique({ where: { session_key_hash: sessionKeyHash } });
    const hasAal2 = Boolean(
      assurance &&
      assurance.user_id === token.id &&
      assurance.assurance_level === MFA_SESSION_ASSURANCE_LEVEL_AAL2 &&
      !assurance.revoked_at &&
      assurance.expires_at.getTime() > Date.now()
    );

    return { userId: token.id, hasAal2 };
  } catch {
    return null;
  }
}

function buildAuthProviders(): Provider[] {
  const config = getUnifiedAuthConfig();
  const providers: Provider[] = [];

  if (config.methods.email.enabled) {
    providers.push(CredentialsProvider({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        const rawIp = requestHeader(req, "x-forwarded-for");
        if (!credentials?.email || !credentials?.password) {
          await logAuthenticationEvent({
            event_code: "AUTH_LOGIN_FAILED",
            outcome: "Failure",
            raw_subject: credentials?.email,
            raw_ip: rawIp,
            sanitized_metadata: { reason: "missing_credentials" }
          });
          throw new Error("Invalid credentials");
        }

        try {
          const user = await createUnifiedAuthenticationService().authenticateEmailPassword({
            email: credentials.email,
            password: credentials.password,
            rawIp,
          });
          return mapUnifiedUser(user);
        } catch (error) {
          await logAuthenticationEvent({
            event_code: error instanceof UnifiedAuthError && error.code === "ACCOUNT_DISABLED"
              ? "AUTH_ACCOUNT_STATUS_DENIED"
              : "AUTH_LOGIN_FAILED",
            outcome: "Failure",
            raw_subject: credentials.email,
            raw_ip: rawIp,
            sanitized_metadata: {
              reason: error instanceof UnifiedAuthError ? error.code : "email_auth_failed",
            }
          });
          throw new Error("Invalid credentials");
        }
      }
    }));
  }

  if (config.methods.whatsapp.enabled) {
    providers.push(CredentialsProvider({
      id: "phone-otp",
      name: "WhatsApp OTP",
      credentials: {
        channel: { label: "Channel", type: "text" },
        phone: { label: "Phone", type: "text" },
        challengeId: { label: "Challenge", type: "text" },
        code: { label: "Code", type: "text" },
        termsAccepted: { label: "Terms", type: "text" },
        privacyAccepted: { label: "Privacy", type: "text" },
      },
      async authorize(credentials, req) {
        const channel = "whatsapp";
        const rawIp = requestHeader(req, "x-forwarded-for");
        if (credentials?.channel !== "whatsapp" || !credentials?.phone || !credentials?.challengeId || !credentials?.code) {
          await logAuthenticationEvent({
            event_code: "AUTH_PHONE_OTP_FAILED",
            outcome: "Failure",
            raw_ip: rawIp,
            sanitized_metadata: { channel, reason: "missing_phone_otp_credentials" }
          });
          throw new Error("Invalid credentials");
        }

        try {
          const user = await createPhoneOtpAuthenticationService().verifyForSignIn({
            channel,
            phone: credentials.phone,
            challengeId: credentials.challengeId,
            code: credentials.code,
            consent: {
              termsAccepted: isAccepted(credentials.termsAccepted),
              privacyAccepted: isAccepted(credentials.privacyAccepted),
            },
            networkKey: rawIp,
          });
          return mapUnifiedUser(user);
        } catch (error) {
          await logAuthenticationEvent({
            event_code: error instanceof UnifiedAuthError && error.code === "ACCOUNT_DISABLED"
              ? "AUTH_ACCOUNT_STATUS_DENIED"
              : "AUTH_PHONE_OTP_FAILED",
            outcome: "Failure",
            raw_ip: rawIp,
            sanitized_metadata: {
              channel,
              reason: error instanceof UnifiedAuthError ? error.code : "phone_otp_auth_failed",
            }
          });
          throw new Error("Invalid credentials");
        }
      }
    }));
  }

  if (config.oauth.google.enabled && config.oauth.google.clientId && config.oauth.google.clientSecret) {
    providers.push(GoogleProvider({
      clientId: config.oauth.google.clientId,
      clientSecret: config.oauth.google.clientSecret,
      checks: ["pkce", "state", "nonce"],
      authorization: { params: { scope: "openid email profile" } },
    }));
  }

  if (config.oauth.facebook.enabled && config.oauth.facebook.clientId && config.oauth.facebook.clientSecret) {
    providers.push(FacebookProvider({
      clientId: config.oauth.facebook.clientId,
      clientSecret: config.oauth.facebook.clientSecret,
      checks: ["state"],
    }));
  }

  if (isPublicAuthMethodEnabled("apple") && config.oauth.apple.clientId && config.oauth.apple.clientSecret) {
    providers.push(AppleProvider({
      clientId: config.oauth.apple.clientId,
      clientSecret: config.oauth.apple.clientSecret,
      checks: ["pkce", "state", "nonce"],
      authorization: { params: { scope: "name email", response_mode: "form_post" } },
    }));
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  providers: buildAuthProviders(),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      const provider = asOAuthProvider(account?.provider);
      if (!provider) return true;

      try {
        const authService = createUnifiedAuthenticationService();
        const linkContext = await resolveCurrentOAuthLinkContext();

        if (linkContext) {
          if (!linkContext.hasAal2) {
            await logAuthenticationEvent({
              event_code: "AUTH_IDENTITY_LINK_BLOCKED",
              outcome: "Failure",
              actor_user_id: linkContext.userId,
              sanitized_metadata: { provider, reason: "AAL2_REQUIRED" },
            });
            return false;
          }

          await authService.linkProviderIdentity({
            userId: linkContext.userId,
            provider,
            providerSubject: account?.providerAccountId,
            profile: profile as Record<string, unknown> | null,
            recentAuthentication: true,
          });
          const linkedUser = await prisma.user.findUnique({
            where: { id: linkContext.userId },
            select: { id: true, email: true, full_name: true, role: true, status: true },
          });
          if (!linkedUser) return false;
          user.id = linkedUser.id;
          user.email = linkedUser.email;
          user.name = linkedUser.full_name;
          (user as { role?: string }).role = linkedUser.role;
          (user as { status?: string }).status = linkedUser.status;
          return true;
        }

        const resolved = await authService.resolveOAuthSignIn({
          provider,
          providerSubject: account?.providerAccountId,
          profile: profile as Record<string, unknown> | null,
          consent: await readOAuthConsent(provider),
        });
        user.id = resolved.id;
        user.email = resolved.email;
        user.name = resolved.full_name;
        (user as { role?: string }).role = resolved.role;
        (user as { status?: string }).status = resolved.status;
        return true;
      } catch (error) {
        await logAuthenticationEvent({
          event_code: error instanceof UnifiedAuthError && error.code === "ACCOUNT_DISABLED"
            ? "AUTH_ACCOUNT_STATUS_DENIED"
            : "AUTH_OAUTH_LOGIN_FAILED",
          outcome: "Failure",
          sanitized_metadata: {
            provider,
            reason: error instanceof UnifiedAuthError ? error.code : "oauth_signin_failed",
          },
        });
        return false;
      }
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.status = (user as { status?: string }).status;
        token.mfaSessionId = generateMfaSessionId();
        await registerUserSession({
          userId: user.id,
          mfaSessionId: token.mfaSessionId,
          tokenExpiresAt: typeof token.exp === "number" ? new Date(token.exp * 1000) : null,
        });
      }

      if (trigger === 'update') {
        // Client updates cannot assert or replace server-bound MFA state.
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === "string" && isTrustedSessionIdentifier(token.mfaSessionId)) {
        const active = await getActiveSessionByHash(token.id, hashSessionIdentifier(token.mfaSessionId));
        if (!active) {
          session.user = undefined as never;
          return session;
        }
        const sessionUser = session.user as typeof session.user & {
          id?: string;
          role?: string;
          status?: string;
          iat?: number;
        };
        sessionUser.id = typeof token.id === "string" ? token.id : undefined;
        sessionUser.role = typeof token.role === "string" ? token.role : undefined;
        sessionUser.status = typeof token.status === "string" ? token.status : undefined;
        sessionUser.iat = typeof token.iat === "number" ? token.iat : undefined;
      } else if (session.user) {
        session.user = undefined as never;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_local_dev_only",
};

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { logAuthenticationEvent } from "./security/events/writers/authentication-writer";
import { getActiveSessionByHash, registerUserSession } from "./auth/session-registry";
import { hashSessionIdentifier, isTrustedSessionIdentifier } from "./security/auth/session-key";

function generateMfaSessionId(): string {
  return randomBytes(32).toString("base64url");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // Extract IP if available (Vercel uses x-forwarded-for, req.headers might have it)
        const raw_ip = req?.headers?.["x-forwarded-for"] as string | undefined;

        if (!credentials?.email || !credentials?.password) {
          await logAuthenticationEvent({
            event_code: "AUTH_LOGIN_FAILED",
            outcome: "Failure",
            raw_subject: credentials?.email,
            raw_ip,
            sanitized_metadata: { reason: "Missing credentials" }
          });
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password_hash) {
          await logAuthenticationEvent({
            event_code: "AUTH_LOGIN_FAILED",
            outcome: "Failure",
            raw_subject: credentials.email,
            raw_ip,
            sanitized_metadata: { reason: "User not found" }
          });
          throw new Error("User not found");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password_hash);

        if (!isValid) {
          await logAuthenticationEvent({
            event_code: "AUTH_LOGIN_FAILED",
            outcome: "Failure",
            actor_user_id: user.id,
            raw_subject: credentials.email,
            raw_ip,
            sanitized_metadata: { reason: "Invalid password" }
          });
          throw new Error("Invalid password");
        }

        if (user.status === "Blacklisted") {
          await logAuthenticationEvent({
            event_code: "AUTH_ACCOUNT_STATUS_DENIED",
            outcome: "Failure",
            actor_user_id: user.id,
            raw_subject: credentials.email,
            raw_ip,
            sanitized_metadata: { status: "Blacklisted" }
          });
          throw new Error("Your account has been blacklisted. Contact support.");
        }

        await logAuthenticationEvent({
          event_code: "AUTH_LOGIN_SUCCEEDED",
          outcome: "Success",
          actor_user_id: user.id,
          raw_subject: credentials.email,
          raw_ip,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          status: user.status
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
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

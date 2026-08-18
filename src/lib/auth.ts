import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import AppleProvider from "next-auth/providers/apple";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { emailCredential: true }
        });

        if (!user) {
          // FR-04: Account Enumeration Safety
          // Do not reveal if the user exists
          throw new Error("Invalid credentials");
        }

        const passwordHash = user.emailCredential?.password_hash || user.password_hash;
        
        if (!passwordHash) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, passwordHash);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        if (user.status === "Blacklisted") {
          throw new Error("Your account has been blacklisted. Contact support.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          status: user.status
        };
      }
    }),
    CredentialsProvider({
      id: "otp",
      name: "OTP",
      credentials: {
        phone: { label: "Phone Number", type: "text", placeholder: "+1234567890" },
        code: { label: "OTP Code", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) {
          throw new Error("Invalid credentials");
        }

        const canonicalPhone = credentials.phone.trim().replace(/\s+/g, '');

        // FR-07: Mobile OTP logic
        // Verify challenge
        const activeChallenge = await prisma.verificationChallenge.findFirst({
          where: {
            purpose: "MOBILE_OTP",
            target_identity: canonicalPhone,
            is_consumed: false,
            expires_at: { gt: new Date() }
          },
          orderBy: { created_at: 'desc' }
        });

        if (!activeChallenge) {
          throw new Error("Invalid or expired code");
        }

        if (activeChallenge.attempt_count >= 3) {
          throw new Error("Maximum attempts exceeded. Request a new code.");
        }

        const isValid = await bcrypt.compare(credentials.code, activeChallenge.challenge_hashed);

        if (!isValid) {
          await prisma.verificationChallenge.update({
            where: { id: activeChallenge.id },
            data: { attempt_count: { increment: 1 } }
          });
          
          await prisma.securityEvent.create({
            data: {
              event_code: "AUTH_OTP_FAILURE",
              source_type: "SYSTEM_ERROR_LOG",
              source_record_id: "nextauth-otp",
              security_domain: "IDENTITY_AND_ACCESS",
              event_category: "Authentication",
              event_classification: "POLICY_VIOLATION",
              severity: "LOW",
              environment: "DEVELOPMENT",
              lifecycle_type: "LIVE",
              source_summary: { canonicalPhone } as any,
              idempotency_key: `otp_fail_${canonicalPhone}_${Date.now()}`,
              occurred_at: new Date(),
              source_received_at: new Date()
            }
          });

          throw new Error("Invalid or expired code");
        }

        // Consume challenge
        await prisma.verificationChallenge.update({
          where: { id: activeChallenge.id },
          data: { is_consumed: true }
        });

        // Find user by phone identity
        const phoneIdentity = await prisma.phoneIdentity.findUnique({
          where: { canonical_phone: canonicalPhone },
          include: { user: true }
        });

        if (!phoneIdentity) {
          // FR-02: New account
          const newUser = await prisma.user.create({
            data: {
              email: `phone_${canonicalPhone.replace('+','')}@rentipid.local`,
              full_name: "New User",
              account_type: "Individual",
              role: "Guest",
              status: "Verified",
              mobile_number: canonicalPhone,
              phoneIdentity: {
                create: {
                  canonical_phone: canonicalPhone,
                  is_verified: true,
                  verified_at: new Date()
                }
              }
            }
          });

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.full_name,
            role: newUser.role,
            status: newUser.status
          };
        }

        if (phoneIdentity.user.status === "Blacklisted") {
          throw new Error("Your account has been blacklisted. Contact support.");
        }

        return {
          id: phoneIdentity.user.id,
          email: phoneIdentity.user.email,
          name: phoneIdentity.user.full_name,
          role: phoneIdentity.user.role,
          status: phoneIdentity.user.status
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "mock-google-id",
      clientSecret: process.env.GOOGLE_SECRET || "mock-google-secret",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_ID || "mock-facebook-id",
      clientSecret: process.env.FACEBOOK_SECRET || "mock-facebook-secret",
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID || "mock-apple-id",
      clientSecret: process.env.APPLE_SECRET || "mock-apple-secret",
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials" || account?.provider === "otp") {
        return true;
      }

      const provider = account?.provider;
      const providerAccountId = account?.providerAccountId;
      
      if (!provider || !providerAccountId) return false;

      const existingIdentity = await prisma.authIdentity.findUnique({
        where: { provider_provider_subject: { provider, provider_subject: providerAccountId } },
        include: { user: true }
      });

      if (existingIdentity) {
        user.id = existingIdentity.user_id;
        (user as any).role = existingIdentity.user.role;
        (user as any).status = existingIdentity.user.status;
        return true;
      }

      const userEmail = user.email || profile?.email;
      if (userEmail) {
        const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });
        if (existingUser) {
          // FR-09: No unsafe merge!
          await prisma.securityEvent.create({
            data: {
              event_code: "AUTH_UNSAFE_MERGE_BLOCKED",
              source_type: "SYSTEM_ERROR_LOG",
              source_record_id: "nextauth-signin",
              security_domain: "IDENTITY_AND_ACCESS",
              event_category: "Authentication",
              event_classification: "POLICY_VIOLATION",
              severity: "MEDIUM",
              environment: "DEVELOPMENT",
              lifecycle_type: "LIVE",
              target_user_id: existingUser.id,
              source_summary: { provider, providerAccountId, userEmail } as any,
              idempotency_key: `blocked_merge_${providerAccountId}_${Date.now()}`,
              occurred_at: new Date(),
              source_received_at: new Date()
            }
          });
          return '/login?error=OAuthAccountNotLinked';
        }
      }

      const syntheticEmail = `${providerAccountId}@${provider}.synthetic.rentipid.local`;
      const finalEmail = userEmail || syntheticEmail;

      // New user
      const newUser = await prisma.user.create({
        data: {
          email: finalEmail,
          full_name: user.name || "New User",
          account_type: "Individual",
          role: "Guest",
          status: "Pending", // Require onboarding
          authIdentities: {
            create: {
              provider,
              provider_subject: providerAccountId,
              provider_email: userEmail || null,
            }
          }
        }
      });

      user.id = newUser.id;
      (user as any).role = newUser.role;
      (user as any).status = newUser.status;
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "Guest";
        token.status = (user as any).status || "Verified";
        
        // FR-13 AuthSession logic
        if (account) {
           const sessionToken = randomBytes(32).toString('hex');
           await prisma.authSession.create({
             data: {
               user_id: user.id as string,
               session_token: sessionToken,
               expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
               authentication_level: account.provider === 'credentials' ? 'PASSWORD' : account.provider === 'otp' ? 'OTP' : 'OAUTH'
             }
           });
           token.sessionId = sessionToken;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;
        
        if (token.sessionId) {
           const dbSession = await prisma.authSession.findUnique({ where: { session_token: token.sessionId as string } });
           if (!dbSession || dbSession.revoked_at || dbSession.expires_at < new Date()) {
              return {} as any; // Revoked or expired
           }
           (session as any).sessionId = token.sessionId;
        }
      }
      return session;
    }
  },
  events: {
    async signOut({ token }) {
      if (token?.sessionId) {
        await prisma.authSession.updateMany({
          where: { session_token: token.sessionId as string },
          data: { revoked_at: new Date() }
        });
      }
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_local_dev_only",
};

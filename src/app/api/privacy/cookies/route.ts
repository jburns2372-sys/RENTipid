import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

import crypto from 'crypto';

const CookieConsentSchema = z.object({
  action: z.enum(['ACCEPT_ALL', 'REJECT_OPTIONAL', 'SAVE_GRANULAR', 'WITHDRAW']),
  preferences: z.object({
    necessary: z.boolean(),
    functional: z.boolean(),
    analytics: z.boolean(),
    marketing: z.boolean(),
  }),
});

export async function POST(req: Request) {
  try {
    const xForwardedFor = req.headers.get('x-forwarded-for');
    const ip = xForwardedFor ? xForwardedFor.split(',').pop()!.trim() : (req.headers.get('x-real-ip') || 'unknown');
    // const userAgent = req.headers.get('user-agent') || 'unknown';

    // Mock authentication: in a real app, use auth middleware to get the user ID
    // For now, we simulate anonymous user if auth fails.
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as {id: string}).id : null; // Replace with actual user ID from auth context
    const isAnonymous = !userId;

    
    const body = await req.json();
    const result = CookieConsentSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid consent parameters' }, { status: 400 });
    }

    const { action, preferences } = result.data;

    // "Do not store more identifying information than necessary."
    // Hashing the IP and user agent to pseudo-anonymize the consent record if justified
    // (e.g., to prevent fraudulent consent spam, but typically IP isn't stored for anonymous)
    // We will generate a unique anonymous_consent_id if the user isn't logged in.
    const anonymousConsentId = isAnonymous ? crypto.randomBytes(16).toString('hex') : null;

    // Determine audit action
    let auditAction = 'COOKIE_PREFERENCES_UPDATED';
    if (action === 'ACCEPT_ALL') auditAction = 'COOKIE_CONSENT_ACCEPTED';
    if (action === 'REJECT_OPTIONAL') auditAction = 'COOKIE_CONSENT_REJECTED';
    if (action === 'WITHDRAW') auditAction = 'COOKIE_CONSENT_WITHDRAWN';

    const policyVersion = '1.0.0'; // Should be fetched dynamically based on current live version

    const consentReceipt = await prisma.cookieConsentReceipt.create({
      data: {
        user_id: userId,
        anonymous_consent_id: anonymousConsentId,
        policy_version: policyVersion,
        consent_version: 1, // Application-specific consent version
        necessary_enabled: preferences.necessary,
        functional_enabled: preferences.functional,
        analytics_enabled: preferences.analytics,
        marketing_enabled: preferences.marketing,
        consent_action: action,
        source: 'WEB_BANNER',
        ip_address: ip,
        user_agent: req.headers.get('user-agent') || 'unknown',
        withdrawn_at: action === 'WITHDRAW' ? new Date() : null,
      }
    });

    await prisma.auditLog.create({
      data: {
        action: auditAction,
        module: 'Privacy',
        target_id: consentReceipt.id,
        actor_user_id: userId,
        details: JSON.stringify({ action, preferences }),
        ip_address: ip,
      }
    });

    return NextResponse.json({ 
      success: true, 
      anonymousConsentId,
      receiptId: consentReceipt.id 
    });

  } catch (error: unknown) {
    console.error('Cookie Consent Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}



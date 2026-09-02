/** @jest-environment jsdom */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  ReadableStream,
  TextDecoderStream,
  TextEncoderStream,
  TransformStream,
  WritableStream,
} from 'node:stream/web';
import { TextDecoder, TextEncoder } from 'node:util';
import { MessageChannel, MessagePort } from 'node:worker_threads';
import Login from '@/app/login/page';
import {
  getGatewayMethodStates,
  isPublicAuthMethodEnabled,
} from '@/lib/auth/unified/config';
import { TwilioVerifyPhoneVerificationProvider } from '@/lib/auth/unified/phone-provider';
import { GENERIC_AUTH_MESSAGE } from '@/lib/auth/unified/services';

Object.assign(globalThis, {
  ReadableStream,
  MessageChannel,
  MessagePort,
  TextDecoder,
  TextDecoderStream,
  TextEncoder,
  TextEncoderStream,
  TransformStream,
  WritableStream,
});

async function installWebPrimitives() {
  const primitives = await import('undici');
  Object.assign(globalThis, {
    Headers: primitives.Headers,
    Request: primitives.Request,
    Response: primitives.Response,
  });
}

const signInMock = jest.fn();
const routerPushMock = jest.fn();
const routerRefreshMock = jest.fn();

jest.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPushMock, refresh: routerRefreshMock }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/components/brand/RentipidLogo', () => ({
  __esModule: true,
  default: () => <div>RENTipid</div>,
}));

const providerEnv = {
  AUTH_WHATSAPP_OTP_ENABLED: 'true',
  TWILIO_ACCOUNT_SID: 'test-account-sid',
  TWILIO_AUTH_TOKEN: 'test-auth-token',
  TWILIO_VERIFY_SERVICE_SID: 'test-verify-service',
};

const gatewayEnv = {
  AUTH_GOOGLE_ENABLED: 'true',
  GOOGLE_CLIENT_ID: 'google-client',
  GOOGLE_CLIENT_SECRET: 'google-secret',
  AUTH_FACEBOOK_ENABLED: 'true',
  FACEBOOK_CLIENT_ID: 'facebook-client',
  FACEBOOK_CLIENT_SECRET: 'facebook-secret',
  AUTH_APPLE_ENABLED: 'true',
  APPLE_CLIENT_ID: 'apple-client',
  APPLE_CLIENT_SECRET: 'apple-secret',
  AUTH_EMAIL_ENABLED: 'true',
  AUTH_SMS_OTP_ENABLED: 'true',
  ...providerEnv,
};

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe('public login provider visibility', () => {
  test('shows Google, Facebook, WhatsApp, and Email while Phone and deferred Apple stay absent', async () => {
    const methods = getGatewayMethodStates(gatewayEnv);
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ methods }),
    }) as unknown as typeof fetch;

    render(<Login />);

    expect(await screen.findByRole('button', { name: 'Continue with Google' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue with Facebook' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue with WhatsApp' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue with Email' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Continue with Phone' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Continue with Apple' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Continue with WhatsApp' }));
    expect(screen.getByLabelText('WhatsApp number')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send code through WhatsApp' })).toBeTruthy();
    expect(screen.queryByText(/SMS/i)).toBeNull();
  });

  test('keeps Apple implementation recoverable behind the explicit deferral flag', () => {
    expect(isPublicAuthMethodEnabled('apple', gatewayEnv)).toBe(false);
    expect(isPublicAuthMethodEnabled('apple', {
      ...gatewayEnv,
      AUTH_APPLE_DEFERRED: 'false',
    })).toBe(true);
  });
});

describe('retired SMS public initiation', () => {
  test('returns a controlled non-enumerating response without calling the OTP service', async () => {
    await installWebPrimitives();
    const { NextRequest } = await import('next/server');
    const { handleOtpPost } = await import('@/lib/auth/unified/otp-route');
    const start = jest.fn();
    const response = await handleOtpPost(new NextRequest('http://localhost/api/auth/otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: '+639171234567', channel: 'sms' }),
    }), { start });

    await expect(response.json()).resolves.toEqual({ message: GENERIC_AUTH_MESSAGE });
    expect(response.status).toBe(200);
    expect(start).not.toHaveBeenCalled();
  });

  test('continues to route WhatsApp initiation to the established OTP service', async () => {
    await installWebPrimitives();
    const { NextRequest } = await import('next/server');
    const { handleOtpPost } = await import('@/lib/auth/unified/otp-route');
    const start = jest.fn().mockResolvedValue({ challengeId: 'whatsapp-challenge' });
    const response = await handleOtpPost(new NextRequest('http://localhost/api/auth/otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: '+63 917 123 4567', channel: 'whatsapp' }),
    }), { start });

    expect(start).toHaveBeenCalledWith(expect.objectContaining({
      phone: '+63 917 123 4567',
      channel: 'whatsapp',
    }));
    await expect(response.json()).resolves.toEqual({
      message: GENERIC_AUTH_MESSAGE,
      challengeId: 'whatsapp-challenge',
    });
  });
});

describe('Twilio WhatsApp provider preservation', () => {
  test('fails closed before fetch for an SMS request', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    const provider = new TwilioVerifyPhoneVerificationProvider(providerEnv);

    await expect(provider.start({
      channel: 'sms',
      phoneE164: '+639171234567',
    })).rejects.toThrow('SMS_AUTH_RETIRED');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('keeps the existing Twilio Verify WhatsApp request selected', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ sid: 'verification-sid' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    const provider = new TwilioVerifyPhoneVerificationProvider(providerEnv);

    await expect(provider.start({
      channel: 'whatsapp',
      phoneE164: '+639171234567',
    })).resolves.toEqual({ providerChallengeId: 'verification-sid' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect((request.body as URLSearchParams).get('Channel')).toBe('whatsapp');
    expect((request.body as URLSearchParams).get('To')).toBe('+639171234567');
  });

  test('does not retry a failed WhatsApp delivery through SMS', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: false });
    global.fetch = fetchMock as unknown as typeof fetch;
    const provider = new TwilioVerifyPhoneVerificationProvider(providerEnv);

    await expect(provider.start({
      channel: 'whatsapp',
      phoneE164: '+639171234567',
    })).rejects.toThrow('TWILIO_VERIFY_REQUEST_FAILED');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect((request.body as URLSearchParams).get('Channel')).toBe('whatsapp');
  });
});

describe('deferred Apple public initiation', () => {
  test('does not issue an OAuth intent while Apple is deferred', async () => {
    await installWebPrimitives();
    const { POST: createOAuthIntent } = await import('@/app/api/auth/oauth/intent/route');
    const previousEnv = { ...process.env };
    Object.assign(process.env, gatewayEnv);
    delete process.env.AUTH_APPLE_DEFERRED;

    try {
      const response = await createOAuthIntent(new Request('http://localhost/api/auth/oauth/intent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider: 'apple',
          termsAccepted: true,
          privacyAccepted: true,
        }),
      }));

      await expect(response.json()).resolves.toEqual({ message: GENERIC_AUTH_MESSAGE });
      expect(response.headers.get('set-cookie')).toBeNull();
    } finally {
      process.env = previousEnv;
    }
  });
});

describe('NextAuth public provider guard contracts', () => {
  test('keeps WhatsApp-only credentials and the Apple deferral gate wired into NextAuth', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const source = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'auth.ts'), 'utf8');

    expect(source).toContain('if (config.methods.whatsapp.enabled)');
    expect(source).toContain('credentials?.channel !== "whatsapp"');
    expect(source).toContain('isPublicAuthMethodEnabled("apple")');
    expect(source).toContain('AppleProvider');
  });
});

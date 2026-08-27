import 'server-only';

import type { PhoneOtpChannel } from './config';
import { getUnifiedAuthConfig } from './config';
import type { PhoneVerificationProvider } from './services';

type TwilioStartResponse = {
  sid?: string;
  status?: string;
};

type TwilioCheckResponse = {
  status?: string;
  valid?: boolean;
};

function twilioChannel(channel: PhoneOtpChannel): 'sms' | 'whatsapp' {
  return channel === 'whatsapp' ? 'whatsapp' : 'sms';
}

function formBody(values: Record<string, string>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) params.set(key, value);
  return params;
}

export class TwilioVerifyPhoneVerificationProvider implements PhoneVerificationProvider {
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly serviceSid: string;

  constructor(env: Record<string, string | undefined> = process.env) {
    const config = getUnifiedAuthConfig(env);
    if (!config.twilioVerify.configured || !config.twilioVerify.accountSid || !config.twilioVerify.authToken || !config.twilioVerify.verifyServiceSid) {
      throw new Error('TWILIO_VERIFY_NOT_CONFIGURED');
    }
    this.accountSid = config.twilioVerify.accountSid;
    this.authToken = config.twilioVerify.authToken;
    this.serviceSid = config.twilioVerify.verifyServiceSid;
  }

  async start(input: { channel: PhoneOtpChannel; phoneE164: string }): Promise<{ providerChallengeId: string }> {
    const response = await this.request<TwilioStartResponse>('Verifications', formBody({
      To: input.phoneE164,
      Channel: twilioChannel(input.channel),
    }));

    if (!response.sid) throw new Error('TWILIO_VERIFY_START_FAILED');
    return { providerChallengeId: response.sid };
  }

  async verify(input: { channel: PhoneOtpChannel; phoneE164: string; providerChallengeId: string; code: string }): Promise<{ approved: boolean }> {
    const response = await this.request<TwilioCheckResponse>('VerificationCheck', formBody({
      To: input.phoneE164,
      Code: input.code,
    }));

    return { approved: response.status === 'approved' || response.valid === true };
  }

  private async request<T>(resource: 'Verifications' | 'VerificationCheck', body: URLSearchParams): Promise<T> {
    const authorization = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
    const endpoint = `https://verify.twilio.com/v2/Services/${encodeURIComponent(this.serviceSid)}/${resource}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authorization}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) throw new Error('TWILIO_VERIFY_REQUEST_FAILED');
    return response.json() as Promise<T>;
  }
}

export class UnconfiguredPhoneVerificationProvider implements PhoneVerificationProvider {
  async start(): Promise<{ providerChallengeId: string }> {
    throw new Error('PHONE_VERIFICATION_PROVIDER_UNCONFIGURED');
  }

  async verify(): Promise<{ approved: boolean }> {
    throw new Error('PHONE_VERIFICATION_PROVIDER_UNCONFIGURED');
  }
}

export function createPhoneVerificationProvider(env: Record<string, string | undefined> = process.env): PhoneVerificationProvider {
  try {
    return new TwilioVerifyPhoneVerificationProvider(env);
  } catch {
    return new UnconfiguredPhoneVerificationProvider();
  }
}

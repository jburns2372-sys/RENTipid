export const AUTH_METHODS = ['google', 'facebook', 'apple', 'email', 'sms', 'whatsapp'] as const;

export type AuthMethod = typeof AUTH_METHODS[number];
export type OAuthAuthMethod = Extract<AuthMethod, 'google' | 'facebook' | 'apple'>;
export type PhoneOtpChannel = Extract<AuthMethod, 'sms' | 'whatsapp'>;

export const AUTH_FEATURE_ENV: Record<AuthMethod, string> = {
  google: 'AUTH_GOOGLE_ENABLED',
  facebook: 'AUTH_FACEBOOK_ENABLED',
  apple: 'AUTH_APPLE_ENABLED',
  email: 'AUTH_EMAIL_ENABLED',
  sms: 'AUTH_SMS_OTP_ENABLED',
  whatsapp: 'AUTH_WHATSAPP_OTP_ENABLED',
};

export const OAUTH_CREDENTIAL_ENV: Record<OAuthAuthMethod, { clientId: string; clientSecret: string }> = {
  google: { clientId: 'GOOGLE_CLIENT_ID', clientSecret: 'GOOGLE_CLIENT_SECRET' },
  facebook: { clientId: 'FACEBOOK_CLIENT_ID', clientSecret: 'FACEBOOK_CLIENT_SECRET' },
  apple: { clientId: 'APPLE_CLIENT_ID', clientSecret: 'APPLE_CLIENT_SECRET' },
};

export const TWILIO_VERIFY_ENV = {
  accountSid: 'TWILIO_ACCOUNT_SID',
  authToken: 'TWILIO_AUTH_TOKEN',
  verifyServiceSid: 'TWILIO_VERIFY_SERVICE_SID',
} as const;

export const DEFAULT_AUTH_TERMS_VERSION = 'unified-multi-login-v1.1';
export const DEFAULT_AUTH_PRIVACY_VERSION = 'unified-multi-login-v1.1';
export const APPLE_LOGIN_DEFERRED_ENV = 'AUTH_APPLE_DEFERRED';

type EnvSource = Record<string, string | undefined>;

export interface AuthMethodState {
  method: AuthMethod;
  flagName: string;
  enabled: boolean;
  configured: boolean;
}

export interface UnifiedAuthConfig {
  methods: Record<AuthMethod, AuthMethodState>;
  oauth: Record<OAuthAuthMethod, { clientId?: string; clientSecret?: string; enabled: boolean; configured: boolean }>;
  twilioVerify: { accountSid?: string; authToken?: string; verifyServiceSid?: string; configured: boolean };
  consent: { termsVersion: string; privacyVersion: string };
}

function hasText(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFeatureFlagEnabled(env: EnvSource, name: string, defaultEnabled = true): boolean {
  const value = env[name];
  if (!hasText(value)) return defaultEnabled;
  const normalized = value.trim().toLowerCase();
  if (['0', 'false', 'off', 'disabled', 'no'].includes(normalized)) return false;
  if (['1', 'true', 'on', 'enabled', 'yes'].includes(normalized)) return true;
  return defaultEnabled;
}

function methodState(method: AuthMethod, env: EnvSource, configured: boolean): AuthMethodState {
  const flagName = AUTH_FEATURE_ENV[method];
  const enabledByFlag = isFeatureFlagEnabled(env, flagName, true);
  return {
    method,
    flagName,
    configured,
    enabled: enabledByFlag && configured,
  };
}

export function getUnifiedAuthConfig(env: EnvSource = process.env): UnifiedAuthConfig {
  const googleConfigured = hasText(env.GOOGLE_CLIENT_ID) && hasText(env.GOOGLE_CLIENT_SECRET);
  const facebookConfigured = hasText(env.FACEBOOK_CLIENT_ID) && hasText(env.FACEBOOK_CLIENT_SECRET);
  const appleConfigured = hasText(env.APPLE_CLIENT_ID) && hasText(env.APPLE_CLIENT_SECRET);
  const twilioConfigured = hasText(env.TWILIO_ACCOUNT_SID) && hasText(env.TWILIO_AUTH_TOKEN) && hasText(env.TWILIO_VERIFY_SERVICE_SID);

  const oauth = {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      configured: googleConfigured,
      enabled: isFeatureFlagEnabled(env, AUTH_FEATURE_ENV.google, true) && googleConfigured,
    },
    facebook: {
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET,
      configured: facebookConfigured,
      enabled: isFeatureFlagEnabled(env, AUTH_FEATURE_ENV.facebook, true) && facebookConfigured,
    },
    apple: {
      clientId: env.APPLE_CLIENT_ID,
      clientSecret: env.APPLE_CLIENT_SECRET,
      configured: appleConfigured,
      enabled: isFeatureFlagEnabled(env, AUTH_FEATURE_ENV.apple, true) && appleConfigured,
    },
  } satisfies UnifiedAuthConfig['oauth'];

  const twilioVerify = {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    verifyServiceSid: env.TWILIO_VERIFY_SERVICE_SID,
    configured: twilioConfigured,
  };

  return {
    methods: {
      google: methodState('google', env, googleConfigured),
      facebook: methodState('facebook', env, facebookConfigured),
      apple: methodState('apple', env, appleConfigured),
      email: methodState('email', env, true),
      sms: methodState('sms', env, twilioConfigured),
      whatsapp: methodState('whatsapp', env, twilioConfigured),
    },
    oauth,
    twilioVerify,
    consent: {
      termsVersion: env.RENTIPID_TERMS_VERSION || DEFAULT_AUTH_TERMS_VERSION,
      privacyVersion: env.RENTIPID_PRIVACY_VERSION || DEFAULT_AUTH_PRIVACY_VERSION,
    },
  };
}

export function getGatewayMethodStates(env: EnvSource = process.env): AuthMethodState[] {
  const config = getUnifiedAuthConfig(env);
  return AUTH_METHODS.map((method) => ({
    ...config.methods[method],
    enabled: isPublicAuthMethodEnabled(method, env),
  }));
}

export function isUnifiedAuthMethodEnabled(method: AuthMethod, env: EnvSource = process.env): boolean {
  return getUnifiedAuthConfig(env).methods[method].enabled;
}

export function isAppleLoginDeferred(env: EnvSource = process.env): boolean {
  return isFeatureFlagEnabled(env, APPLE_LOGIN_DEFERRED_ENV, true);
}

export function isPublicAuthMethodEnabled(method: AuthMethod, env: EnvSource = process.env): boolean {
  if (method === 'sms') return false;
  if (method === 'apple' && isAppleLoginDeferred(env)) return false;
  return isUnifiedAuthMethodEnabled(method, env);
}

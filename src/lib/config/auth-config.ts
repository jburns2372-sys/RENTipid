export const authConfig = {
  providers: {
    google: process.env.ENABLE_GOOGLE_AUTH === 'true',
    facebook: process.env.ENABLE_FACEBOOK_AUTH === 'true',
    apple: process.env.ENABLE_APPLE_AUTH === 'true',
    email: process.env.ENABLE_EMAIL_AUTH !== 'false', // Enabled by default
    otp: process.env.ENABLE_OTP_AUTH === 'true',
  },
  policies: {
    otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
    otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),
    otpRateLimitSeconds: parseInt(process.env.OTP_RATE_LIMIT_SECONDS || '60', 10),
    sessionDurationDays: parseInt(process.env.SESSION_DURATION_DAYS || '30', 10),
    privilegedStepUpRequired: process.env.REQUIRE_PRIVILEGED_MFA === 'true',
  }
};

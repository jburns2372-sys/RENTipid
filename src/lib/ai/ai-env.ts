// AI Environment Configuration and Validation

export const aiEnv = {
  DIGITAL_HUMAN_API_URL: process.env.DIGITAL_HUMAN_API_URL || '',
  DIGITAL_HUMAN_API_KEY: process.env.DIGITAL_HUMAN_API_KEY || '',
  AI_FALLBACK_MODE_ENABLED: process.env.AI_FALLBACK_MODE_ENABLED === 'true',
  AI_PROVIDER_MOCK_ENABLED: process.env.AI_PROVIDER_MOCK_ENABLED === 'true',
  AI_MAX_SESSION_DURATION_MS: parseInt(process.env.AI_MAX_SESSION_DURATION_MS || '3600000', 10),
};

export function validateAiEnvironment() {
  const errors: string[] = [];

  if (!aiEnv.AI_PROVIDER_MOCK_ENABLED) {
    if (!aiEnv.DIGITAL_HUMAN_API_URL) {
      errors.push('DIGITAL_HUMAN_API_URL is missing in environment.');
    }
    if (!aiEnv.DIGITAL_HUMAN_API_KEY) {
      errors.push('DIGITAL_HUMAN_API_KEY is missing in environment.');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export interface OpenAIConfig {
  apiKey: string | undefined;
  modelPrimary: string;
  groundedComposerEnabled: boolean;
  timeoutMs: number;
  maxOutputTokens: number;
  maxEvidenceTokens: number;
  storeResponses: boolean;
  temperature: number;
}

export function getOpenAIConfig(): OpenAIConfig {
  return {
    apiKey: process.env.OPENAI_API_KEY,
    modelPrimary: process.env.OPENAI_MODEL_PRIMARY || 'gpt-4o-mini',
    groundedComposerEnabled: process.env.OPENAI_GROUNDED_COMPOSER_ENABLED === 'true',
    timeoutMs: parseInt(process.env.OPENAI_TIMEOUT_MS || '15000', 10),
    maxOutputTokens: parseInt(process.env.OPENAI_MAX_OUTPUT_TOKENS || '500', 10),
    maxEvidenceTokens: parseInt(process.env.OPENAI_MAX_EVIDENCE_TOKENS || '6000', 10),
    storeResponses: process.env.OPENAI_STORE_RESPONSES === 'true',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.2'),
  };
}

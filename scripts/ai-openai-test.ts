import { processAICommand } from '../src/lib/ai/ai-command-layer';

async function main() {
  console.log('Running live key test for OpenAI Provider...');
  
  // Set required env vars if not present
  if (!process.env.OPENAI_API_KEY) {
    console.warn('WARNING: OPENAI_API_KEY is not set. The test may fail.');
  }
  process.env.OPENAI_GROUNDED_COMPOSER_ENABLED = 'true';
  process.env.OPENAI_MODEL_PRIMARY = 'gpt-4o-mini';

  try {
    const response = await processAICommand({
      botId: 'rentipid-helper',
      prompt: 'What happens if I crash a rented car?',
      module: 'help',
    });

    console.log('\n--- RESPONSE ---');
    console.log(JSON.stringify(response, null, 2));

    if (response.grounding?.composerProvider === 'openai') {
      console.log('\n✅ Successfully used the OpenAI provider.');
    } else {
      console.log('\n⚠️ Did not use the OpenAI provider. Used:', response.grounding?.composerProvider);
    }
  } catch (error) {
    console.error('Error during AI command processing:', error);
  }
}

main().catch(console.error);

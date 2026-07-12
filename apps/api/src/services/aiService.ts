import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { DefaultAzureCredential } from '@azure/identity';

const endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
// In production, we'd use DefaultAzureCredential. Using KeyCredential as a fallback pattern.
const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
const credential = azureApiKey ? new AzureKeyCredential(azureApiKey) : new DefaultAzureCredential();

let openaiClient: OpenAIClient | null = null;
if (endpoint) {
  openaiClient = new OpenAIClient(endpoint, credential);
  console.log('Azure OpenAI Client initialized.');
}

/**
 * Generates vector embeddings for a given text payload using Azure OpenAI.
 * Useful for indexing Listings into Azure AI Search.
 */
export const generateEmbeddings = async (text: string): Promise<number[]> => {
  if (!openaiClient) throw new Error('Azure OpenAI Client not initialized');
  
  const deploymentId = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-ada-002';
  
  const response = await openaiClient.getEmbeddings(deploymentId, [text]);
  return response.data[0].embedding;
};

/**
 * Handles RAG-based Chat Completions over the Azure OpenAI boundary.
 */
export const generateChatCompletion = async (messages: any[]): Promise<string> => {
  if (!openaiClient) throw new Error('Azure OpenAI Client not initialized');
  
  const deploymentId = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || 'gpt-4o';
  
  const response = await openaiClient.getChatCompletions(deploymentId, messages, {
    temperature: 0.3,
    maxTokens: 1000
  });
  
  return response.choices[0].message?.content || '';
};
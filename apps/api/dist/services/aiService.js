"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChatCompletion = exports.generateEmbeddings = void 0;
const openai_1 = require("@azure/openai");
const identity_1 = require("@azure/identity");
const endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
// In production, we'd use DefaultAzureCredential. Using KeyCredential as a fallback pattern.
const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
const credential = azureApiKey ? new openai_1.AzureKeyCredential(azureApiKey) : new identity_1.DefaultAzureCredential();
let openaiClient = null;
if (endpoint) {
    openaiClient = new openai_1.OpenAIClient(endpoint, credential);
    console.log('Azure OpenAI Client initialized.');
}
/**
 * Generates vector embeddings for a given text payload using Azure OpenAI.
 * Useful for indexing Listings into Azure AI Search.
 */
const generateEmbeddings = async (text) => {
    if (!openaiClient)
        throw new Error('Azure OpenAI Client not initialized');
    const deploymentId = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-ada-002';
    const response = await openaiClient.getEmbeddings(deploymentId, [text]);
    return response.data[0].embedding;
};
exports.generateEmbeddings = generateEmbeddings;
/**
 * Handles RAG-based Chat Completions over the Azure OpenAI boundary.
 */
const generateChatCompletion = async (messages) => {
    if (!openaiClient)
        throw new Error('Azure OpenAI Client not initialized');
    const deploymentId = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || 'gpt-4o';
    const response = await openaiClient.getChatCompletions(deploymentId, messages, {
        temperature: 0.3,
        maxTokens: 1000
    });
    return response.choices[0].message?.content || '';
};
exports.generateChatCompletion = generateChatCompletion;

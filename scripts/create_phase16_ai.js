const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const appsApiDir = path.join(rootDir, 'apps', 'api');

// 1. aiService.ts
fs.writeFileSync(path.join(appsApiDir, 'src', 'services', 'aiService.ts'), [
  "import { OpenAIClient, AzureKeyCredential } from '@azure/openai';",
  "import { DefaultAzureCredential } from '@azure/identity';",
  "",
  "const endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';",
  "// In production, we'd use DefaultAzureCredential. Using KeyCredential as a fallback pattern.",
  "const azureApiKey = process.env.AZURE_OPENAI_API_KEY;",
  "const credential = azureApiKey ? new AzureKeyCredential(azureApiKey) : new DefaultAzureCredential();",
  "",
  "let openaiClient: OpenAIClient | null = null;",
  "if (endpoint) {",
  "  openaiClient = new OpenAIClient(endpoint, credential);",
  "  console.log('Azure OpenAI Client initialized.');",
  "}",
  "",
  "/**",
  " * Generates vector embeddings for a given text payload using Azure OpenAI.",
  " * Useful for indexing Listings into Azure AI Search.",
  " */",
  "export const generateEmbeddings = async (text: string): Promise<number[]> => {",
  "  if (!openaiClient) throw new Error('Azure OpenAI Client not initialized');",
  "  ",
  "  const deploymentId = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-ada-002';",
  "  ",
  "  const response = await openaiClient.getEmbeddings(deploymentId, [text]);",
  "  return response.data[0].embedding;",
  "};",
  "",
  "/**",
  " * Handles RAG-based Chat Completions over the Azure OpenAI boundary.",
  " */",
  "export const generateChatCompletion = async (messages: any[]): Promise<string> => {",
  "  if (!openaiClient) throw new Error('Azure OpenAI Client not initialized');",
  "  ",
  "  const deploymentId = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || 'gpt-4o';",
  "  ",
  "  const response = await openaiClient.getChatCompletions(deploymentId, messages, {",
  "    temperature: 0.3,",
  "    maxTokens: 1000",
  "  });",
  "  ",
  "  return response.choices[0].message?.content || '';",
  "};"
].join('\\n'));

// 2. searchService.ts
fs.writeFileSync(path.join(appsApiDir, 'src', 'services', 'searchService.ts'), [
  "import { SearchClient, AzureKeyCredential } from '@azure/search-documents';",
  "import { generateEmbeddings } from './aiService';",
  "",
  "const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT || '';",
  "const searchKey = process.env.AZURE_SEARCH_API_KEY || '';",
  "const indexName = process.env.AZURE_SEARCH_INDEX || 'rentipid-listings-index';",
  "",
  "let searchClient: SearchClient<any> | null = null;",
  "if (searchEndpoint && searchKey) {",
  "  searchClient = new SearchClient(searchEndpoint, indexName, new AzureKeyCredential(searchKey));",
  "  console.log('Azure AI Search Client initialized.');",
  "}",
  "",
  "interface ListingDocument {",
  "  id: string;",
  "  title: string;",
  "  description: string;",
  "  category: string;",
  "  daily_rate: number;",
  "  vector_embedding: number[];",
  "}",
  "",
  "/**",
  " * Converts a Prisma Listing into an AI Search Document and pushes it to Azure.",
  " * Typically called by an Azure Service Bus queue worker after a listing is created.",
  " */",
  "export const indexListingToAzureSearch = async (listing: any) => {",
  "  if (!searchClient) throw new Error('Azure AI Search Client not configured');",
  "",
  "  // 1. Construct semantic payload",
  "  const semanticText = `Title: ${listing.title}. Category: ${listing.category}. Description: ${listing.description}.`;",
  "  ",
  "  // 2. Request Embedding from Azure OpenAI",
  "  const embedding = await generateEmbeddings(semanticText);",
  "  ",
  "  // 3. Map to Document structure",
  "  const document: ListingDocument = {",
  "    id: listing.id,",
  "    title: listing.title,",
  "    description: listing.description,",
  "    category: listing.category,",
  "    daily_rate: listing.daily_rate,",
  "    vector_embedding: embedding",
  "  };",
  "",
  "  // 4. Upload to Azure AI Search",
  "  await searchClient.uploadDocuments([document]);",
  "  console.log(`Successfully indexed Listing ${listing.id} into Azure AI Search.`);",
  "};"
].join('\\n'));

// 3. Update package.json
const pkgPath = path.join(appsApiDir, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.dependencies = pkg.dependencies || {};
  pkg.dependencies['@azure/openai'] = '^1.0.0-beta.12';
  pkg.dependencies['@azure/search-documents'] = '^12.0.0';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

console.log("Phase 16 AI Search and RAG scaffolded.");

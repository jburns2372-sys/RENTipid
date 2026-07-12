import { SearchClient, AzureKeyCredential } from '@azure/search-documents';
import { generateEmbeddings } from './aiService';

const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT || '';
const searchKey = process.env.AZURE_SEARCH_API_KEY || '';
const indexName = process.env.AZURE_SEARCH_INDEX || 'rentipid-listings-index';

let searchClient: SearchClient<any> | null = null;
if (searchEndpoint && searchKey) {
  searchClient = new SearchClient(searchEndpoint, indexName, new AzureKeyCredential(searchKey));
  console.log('Azure AI Search Client initialized.');
}

interface ListingDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  daily_rate: number;
  vector_embedding: number[];
}

/**
 * Converts a Prisma Listing into an AI Search Document and pushes it to Azure.
 * Typically called by an Azure Service Bus queue worker after a listing is created.
 */
export const indexListingToAzureSearch = async (listing: any) => {
  if (!searchClient) throw new Error('Azure AI Search Client not configured');

  // 1. Construct semantic payload
  const semanticText = `Title: ${listing.title}. Category: ${listing.category}. Description: ${listing.description}.`;
  
  // 2. Request Embedding from Azure OpenAI
  const embedding = await generateEmbeddings(semanticText);
  
  // 3. Map to Document structure
  const document: ListingDocument = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    daily_rate: listing.daily_rate,
    vector_embedding: embedding
  };

  // 4. Upload to Azure AI Search
  await searchClient.uploadDocuments([document]);
  console.log(`Successfully indexed Listing ${listing.id} into Azure AI Search.`);
};
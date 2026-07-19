"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexListingToAzureSearch = void 0;
const search_documents_1 = require("@azure/search-documents");
const aiService_1 = require("./aiService");
const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT || '';
const searchKey = process.env.AZURE_SEARCH_API_KEY || '';
const indexName = process.env.AZURE_SEARCH_INDEX || 'rentipid-listings-index';
let searchClient = null;
if (searchEndpoint && searchKey) {
    searchClient = new search_documents_1.SearchClient(searchEndpoint, indexName, new search_documents_1.AzureKeyCredential(searchKey));
    console.log('Azure AI Search Client initialized.');
}
/**
 * Converts a Prisma Listing into an AI Search Document and pushes it to Azure.
 * Typically called by an Azure Service Bus queue worker after a listing is created.
 */
const indexListingToAzureSearch = async (listing) => {
    if (!searchClient)
        throw new Error('Azure AI Search Client not configured');
    // 1. Construct semantic payload
    const semanticText = `Title: ${listing.title}. Category: ${listing.category}. Description: ${listing.description}.`;
    // 2. Request Embedding from Azure OpenAI
    const embedding = await (0, aiService_1.generateEmbeddings)(semanticText);
    // 3. Map to Document structure
    const document = {
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
exports.indexListingToAzureSearch = indexListingToAzureSearch;

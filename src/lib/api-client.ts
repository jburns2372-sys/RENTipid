import { getSession } from 'next-auth/react';

/**
 * Phase 12: Centralized API Client for routing requests to Azure API.
 * This utility ensures NextAuth tokens are securely passed across domains.
 */
export const azureFetch = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  
  // Determine feature flag routing natively
  // If NEXT_PUBLIC_USE_AZURE_BACKEND is false, we might want to route to old Vercel Server Actions instead
  const useAzure = process.env.NEXT_PUBLIC_USE_AZURE_BACKEND === 'true';
  if (!useAzure) {
    console.warn('Azure backend is disabled. Falling back to local Vercel API.');
    // In a real gradual rollout, you would call the old Next.js API route here
  }

  // Automatically attach NextAuth session token for Azure Middleware to verify
  const session = await getSession();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (session && (session as any).accessToken) {
    // Depending on NextAuth config, the JWT might be in cookies or explicitly required as Bearer
    headers['Authorization'] = `Bearer ${(session as any).accessToken}`;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `API Request failed with status ${response.status}`);
  }

  return response.json();
};
export function checkSocialGuardrails(postContent: string, listingStatus?: string, providerStatus?: string): { isSafe: boolean; reason?: string } {
  // Check Listing Status
  if (listingStatus && listingStatus !== 'Published') {
    return { isSafe: false, reason: `Listing is currently ${listingStatus}. Only Published listings can be promoted.` };
  }

  // Check Provider Status
  if (providerStatus && (providerStatus === 'Suspended' || providerStatus === 'Blacklisted')) {
    return { isSafe: false, reason: `Provider is currently ${providerStatus}. Cannot promote listings from this provider.` };
  }

  // Check Prohibited Content / Private Info
  const lowerContent = postContent.toLowerCase();
  
  const blockedPatterns = [
    /\b(password|ssn|credit card|cvv)\b/i,
    /document\/verify/i,
    /private_pickup_address/i, // Example token
    /guaranteed cheapest/i // Business rule check
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(lowerContent)) {
      return { isSafe: false, reason: "Post content violates safety guardrails (prohibited keywords or private info detected)." };
    }
  }

  return { isSafe: true };
}

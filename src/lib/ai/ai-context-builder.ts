export function buildSafeContext(
  role: string | undefined, 
  module: string, 
  recordId?: string
): string {
  // In a real implementation, this would fetch data from the DB based on recordId,
  // ensure the user has access to it, and filter out sensitive fields.
  // For Phase 7, we simulate this context building.
  
  const contextParts: string[] = [`Module: ${module}`];
  
  if (recordId) {
    contextParts.push(`Record Focus: ${recordId}`);
  }
  
  if (module === 'Booking' && role === 'Renter') {
    contextParts.push("Context: Booking is Pending Payment. Awaiting renter action.");
  } else if (module === 'Booking' && role === 'Individual Provider') {
    contextParts.push("Context: Booking is confirmed. Please prepare for turnover.");
  } else if (module === 'Listing' && role?.includes('Provider')) {
    contextParts.push("Context: Listing is drafted but missing photos.");
  } else if (module === 'KYC') {
    contextParts.push("Context: ID uploaded but Business Permit is missing.");
  } else if (module === 'Dispute' && role?.includes('Admin')) {
    contextParts.push("Context: Claim amount is 1000. Evidence provided by both parties. Status: Under Review.");
  } else {
    contextParts.push("Context: Generic module view.");
  }

  // Safety strict stripping (example)
  // Ensures passwords or tokens would never be passed if we had actual DB objects
  
  return contextParts.join('\n');
}

/**
 * Simulates intent resolution from a user prompt.
 * In a real implementation, this would be an LLM call or NLU classification.
 */
export function resolveIntent(prompt: string): string | undefined {
  const lowerPrompt = prompt.toLowerCase();
  
  if (/\b(?:cancel|change|modify)\b.{0,20}\bbooking\b/.test(lowerPrompt)) return 'booking_cancel';
  if (/\b(?:booking status|status of my booking)\b/.test(lowerPrompt)) return 'booking_status';
  if (/^(?:please\s+)?(?:refund|issue\s+(?:a\s+)?refund)\b/.test(lowerPrompt)) return 'refund_request';
  if (/\b(?:refund|payment|paid|payout|earnings|deposit)\b/.test(lowerPrompt)) return 'payment_inquiry';
  if (/\b(?:book|booking|reserve|reservation)\b/.test(lowerPrompt)) return 'booking_help';
  if (lowerPrompt.includes('damage') || lowerPrompt.includes('dispute')) return 'damage_report';
  if (lowerPrompt.includes('extend rental')) return 'rental_extend';
  if (lowerPrompt.includes('insurance')) return 'insurance_info';
  if (/\b(?:is|was|check|status)\b.{0,25}\b(?:kyc|identity verification)\b/.test(lowerPrompt)) return 'kyc_status';
  if (lowerPrompt.includes('kyc') || lowerPrompt.includes('verify identity')) return 'kyc_account_support';
  if (/\b(?:listing|list an item|add another rental|provider account)\b/.test(lowerPrompt)) return 'provider_operational_support';
  if (/\b(?:register|registration|sign up|create an account|create a rentipid account)\b/.test(lowerPrompt)) return 'kyc_account_support';
  
  return undefined; // Default/unknown
}

export function resolveDomainIntent(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase();
  const domains: string[] = [];
  
  if (/\b(legal|laws?|compliance|regulations?|jurisdictions?)\b/.test(lowerPrompt)) {
    domains.push('Legal', 'Compliance');
  }
  if (/\b(register|registration|newcomer|join|account|profile|onboard|onboarding|sign up|signup|login|log in|password|forgot|reset|cannot log in|verify|verification|change|information)\b/.test(lowerPrompt)) {
    domains.push('Core', 'Profile');
  }
  if (/\b(book|booking|booked|reserve|reservation|rent|renter|renters|rental|checkout|list|listed|listing|listings|publish|published|offer|equipment|marketplace|item|provider|browse|search|discover|inspection|turnover|return|agreement|review|reviews|feedback)\b/.test(lowerPrompt)) {
    domains.push('Marketplace');
  }
  if (/\b(pay|paid|payment|payments|refund|refunds|deposit|deposits|payout|payouts)\b/.test(lowerPrompt)) {
    domains.push('Payments', 'Finance');
  }
  if (/\b(claim|claims|dispute|disputes|mediation|mediated|damage|insurance)\b/.test(lowerPrompt)) {
    domains.push('Insurance', 'Trust & Safety');
  }
  if (/\b(prohibited|restricted|firearms?|weapons?|unsafe)\b/.test(lowerPrompt)) {
    domains.push('Trust & Safety', 'Security');
  }
  if (/\b(security|privacy|data)\b/.test(lowerPrompt)) {
    domains.push('Security', 'Privacy');
  }
  if (/\b(help|support|guidance|contact|notification|notifications|alert|alerts)\b/.test(lowerPrompt)) {
    domains.push('Core');
  }
  if (/\b(ai|artificial intelligence|policy)\b/.test(lowerPrompt)) {
    domains.push('Unified AI');
  }
  if (/\b(social|campaign|marketing|promotion|promote|caption|hashtag)\b/.test(lowerPrompt)) {
    domains.push('Social');
  }
  if (/\b(identity|kyc|verification)\b/.test(lowerPrompt)) {
    domains.push('Core', 'Trust & Safety');
  }
  if (/\b(address|addresses|pass4)\b/.test(lowerPrompt)) {
    domains.push('Address');
  }
  if (/\b(rbac|roles?|permissions?|finance admin|compliance admin|super admin)\b/.test(lowerPrompt)) {
    domains.push('Security');
  }
  
  return [...new Set(domains)];
}

/**
 * Simulates intent resolution from a user prompt.
 * In a real implementation, this would be an LLM call or NLU classification.
 */
export function resolveIntent(prompt: string): string | undefined {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('cancel booking') || lowerPrompt.includes('booking status')) return 'booking_cancel';
  if (lowerPrompt.includes('refund')) return 'refund_request';
  if (lowerPrompt.includes('payment')) return 'payment_inquiry';
  if (lowerPrompt.includes('damage') || lowerPrompt.includes('dispute')) return 'damage_report';
  if (lowerPrompt.includes('extend rental')) return 'rental_extend';
  if (lowerPrompt.includes('insurance')) return 'insurance_info';
  if (lowerPrompt.includes('kyc') || lowerPrompt.includes('verify identity')) return 'kyc_status';
  if (lowerPrompt.includes('payout')) return 'payout_status';
  
  return undefined; // Default/unknown
}

export function resolveDomainIntent(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase();
  const domains: string[] = [];
  
  if (/\b(legal|laws?|compliance|regulations?|jurisdictions?)\b/.test(lowerPrompt)) {
    domains.push('Legal', 'Compliance');
  }
  if (/\b(register|registration|newcomer|join|account|profile|onboard|onboarding|sign up|signup|login)\b/.test(lowerPrompt)) {
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

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
  
  if (/\b(legal|law|compliance|regulation|jurisdiction|policy)\b/.test(lowerPrompt)) {
    domains.push('Legal', 'Compliance');
  }
  if (/\b(register|account|onboard|sign up|login)\b/.test(lowerPrompt)) {
    domains.push('Core', 'Profile');
  }
  if (/\b(book|rent|checkout)\b/.test(lowerPrompt)) {
    domains.push('Marketplace');
  }
  if (/\b(pay|refund|deposit|payout)\b/.test(lowerPrompt)) {
    domains.push('Payments', 'Finance');
  }
  if (/\b(claim|dispute|damage|insurance)\b/.test(lowerPrompt)) {
    domains.push('Insurance', 'Trust & Safety');
  }
  if (/\b(security|privacy|data)\b/.test(lowerPrompt)) {
    domains.push('Security', 'Privacy');
  }
  
  return domains;
}

export type IntentCategory = 'Booking' | 'Cancellation' | 'Rental' | 'Deposit' | 'Payment' | 'Refund' | 'Damage' | 'Claims' | 'Insurance' | 'KYC' | 'Provider' | 'Account' | 'Continuity' | 'Customer support model' | 'General';

export type AuthorityClass = 'INFORMATION' | 'PERSONALIZED' | 'ACTION';

export interface SupportSuggestion {
  id: string;
  question: string;
  intent: IntentCategory;
  roleScope: ('RENTER' | 'PROVIDER' | 'ANY')[];
  routeScope: ('ANY' | '/help' | '/dashboard' | '/booking' | '/payment')[];
  authorityType: AuthorityClass;
  priority: number;
  authenticationRequirement: boolean;
  toolMapping?: string[];
}

// In-memory static registry for v1.1
export const SUGGESTION_REGISTRY: SupportSuggestion[] = [
  // Booking
  { id: 'S-B-1', question: 'Where is my booking?', intent: 'Booking', roleScope: ['RENTER'], routeScope: ['ANY'], authorityType: 'PERSONALIZED', priority: 10, authenticationRequirement: true },
  { id: 'S-B-2', question: 'Has the provider accepted my booking?', intent: 'Booking', roleScope: ['RENTER'], routeScope: ['ANY'], authorityType: 'PERSONALIZED', priority: 9, authenticationRequirement: true },
  { id: 'S-B-3', question: 'Can I change my booking dates?', intent: 'Booking', roleScope: ['RENTER'], routeScope: ['ANY'], authorityType: 'ACTION', priority: 8, authenticationRequirement: true, toolMapping: ['modifyBookingTool'] },

  // Cancellation
  { id: 'S-C-1', question: 'Can I cancel my booking?', intent: 'Cancellation', roleScope: ['RENTER'], routeScope: ['ANY'], authorityType: 'ACTION', priority: 10, authenticationRequirement: true, toolMapping: ['cancelBookingTool'] },

  // Rental
  { id: 'S-R-1', question: 'Can I extend my rental?', intent: 'Rental', roleScope: ['RENTER'], routeScope: ['ANY'], authorityType: 'ACTION', priority: 10, authenticationRequirement: true, toolMapping: ['extendRentalTool'] },

  // Deposit
  { id: 'S-D-1', question: 'How much is my security deposit?', intent: 'Deposit', roleScope: ['RENTER'], routeScope: ['ANY'], authorityType: 'PERSONALIZED', priority: 10, authenticationRequirement: true },
  { id: 'S-D-2', question: 'Why is my security deposit still being held?', intent: 'Deposit', roleScope: ['RENTER'], routeScope: ['ANY'], authorityType: 'PERSONALIZED', priority: 9, authenticationRequirement: true },
  { id: 'S-D-3', question: 'When will my security deposit be released?', intent: 'Deposit', roleScope: ['RENTER'], routeScope: ['ANY'], authorityType: 'PERSONALIZED', priority: 8, authenticationRequirement: true },

  // Payment
  { id: 'S-P-1', question: 'Why was money charged to my card?', intent: 'Payment', roleScope: ['ANY'], routeScope: ['ANY'], authorityType: 'PERSONALIZED', priority: 10, authenticationRequirement: true },
  { id: 'S-P-2', question: 'My payment failed. What should I do?', intent: 'Payment', roleScope: ['ANY'], routeScope: ['ANY'], authorityType: 'INFORMATION', priority: 9, authenticationRequirement: false },

  // Refund
  { id: 'S-RF-1', question: 'Where is my refund?', intent: 'Refund', roleScope: ['ANY'], routeScope: ['ANY'], authorityType: 'PERSONALIZED', priority: 10, authenticationRequirement: true },
  { id: 'S-RF-2', question: 'Can I get a refund?', intent: 'Refund', roleScope: ['ANY'], routeScope: ['ANY'], authorityType: 'INFORMATION', priority: 9, authenticationRequirement: false },

  // Damage & Claims
  { id: 'S-DM-1', question: 'How do I report damage?', intent: 'Damage', roleScope: ['ANY'], routeScope: ['ANY'], authorityType: 'ACTION', priority: 10, authenticationRequirement: true, toolMapping: ['reportDamageTool'] },
  { id: 'S-CL-1', question: 'What is the status of my claim/dispute?', intent: 'Claims', roleScope: ['ANY'], routeScope: ['ANY'], authorityType: 'PERSONALIZED', priority: 10, authenticationRequirement: true },

  // Insurance
  { id: 'S-I-1', question: 'Does my rental have insurance?', intent: 'Insurance', roleScope: ['ANY'], routeScope: ['ANY'], authorityType: 'PERSONALIZED', priority: 10, authenticationRequirement: true },

  // KYC
  { id: 'S-K-1', question: 'Why is my identity verification pending?', intent: 'KYC', roleScope: ['ANY'], routeScope: ['ANY'], authorityType: 'PERSONALIZED', priority: 10, authenticationRequirement: true },

  // Provider
  { id: 'S-PR-1', question: 'Why is my listing still under review?', intent: 'Provider', roleScope: ['PROVIDER'], routeScope: ['ANY'], authorityType: 'PERSONALIZED', priority: 10, authenticationRequirement: true },
  { id: 'S-PR-2', question: 'Where is my payout?', intent: 'Provider', roleScope: ['PROVIDER'], routeScope: ['ANY'], authorityType: 'PERSONALIZED', priority: 9, authenticationRequirement: true },

  // Account & Continuity
  { id: 'S-A-1', question: 'I cannot log in. What should I do?', intent: 'Account', roleScope: ['ANY'], routeScope: ['ANY'], authorityType: 'INFORMATION', priority: 10, authenticationRequirement: false },
  { id: 'S-CO-1', question: 'Will I lose my conversation if I close the app?', intent: 'Continuity', roleScope: ['ANY'], routeScope: ['ANY'], authorityType: 'INFORMATION', priority: 10, authenticationRequirement: false },

  // Customer Support Model
  { id: 'S-CS-1', question: 'Can I talk to a human customer-service agent?', intent: 'Customer support model', roleScope: ['ANY'], routeScope: ['ANY'], authorityType: 'INFORMATION', priority: 10, authenticationRequirement: false },
];

export class SupportSuggestionEngine {
  static getSuggestions(role: 'RENTER' | 'PROVIDER' | 'ANY', isAuthenticated: boolean, currentRoute: string = 'ANY', limit: number = 4): SupportSuggestion[] {
    let filtered = SUGGESTION_REGISTRY.filter(s => {
      // Role scope check
      if (s.roleScope.indexOf('ANY') === -1 && s.roleScope.indexOf(role) === -1) return false;
      
      // Auth check
      if (s.authenticationRequirement && !isAuthenticated) return false;

      // Route scope check (simplified)
      if (s.routeScope.indexOf('ANY') === -1) {
        let routeMatch = false;
        for (const route of s.routeScope) {
          if (currentRoute.startsWith(route)) {
            routeMatch = true;
            break;
          }
        }
        if (!routeMatch) return false;
      }

      return true;
    });

    // Sort by priority desc
    filtered.sort((a, b) => b.priority - a.priority);

    // Get top ones, ensuring some diversity if possible (naive approach: just slice)
    return filtered.slice(0, limit);
  }

  static getTopics(): IntentCategory[] {
    const topics = new Set<IntentCategory>();
    for (const s of SUGGESTION_REGISTRY) {
      topics.add(s.intent);
    }
    return Array.from(topics);
  }
}

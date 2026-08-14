export interface SupportSuggestion {
  id: string;
  displayText: string;
  type: 'question' | 'topic';
  intent?: string;
  roleScope: string[]; // '*' means all roles
  routeScope?: string[]; // optionally restrict to specific client routes
  priority: number;
  knowledgeSource?: string;
  toolIntent?: string;
  status: 'enabled' | 'disabled';
  version: string;
}

export const suggestionRegistry: SupportSuggestion[] = [
  // High-value questions
  { id: 'q-booking-where', displayText: 'Where is my booking?', type: 'question', intent: 'booking_status', roleScope: ['Renter', 'Provider'], priority: 100, status: 'enabled', version: '1.0' },
  { id: 'q-booking-accepted', displayText: 'Has the provider accepted my booking?', type: 'question', intent: 'booking_acceptance', roleScope: ['Renter'], priority: 95, status: 'enabled', version: '1.0' },
  { id: 'q-booking-cancel', displayText: 'Can I cancel my booking?', type: 'question', intent: 'booking_cancel', roleScope: ['Renter'], priority: 90, status: 'enabled', version: '1.0' },
  { id: 'q-booking-change', displayText: 'Can I change my booking dates?', type: 'question', intent: 'booking_change', roleScope: ['Renter'], priority: 85, status: 'enabled', version: '1.0' },
  { id: 'q-booking-extend', displayText: 'Can I extend my rental?', type: 'question', intent: 'rental_extend', roleScope: ['Renter'], priority: 80, status: 'enabled', version: '1.0' },
  { id: 'q-deposit-amount', displayText: 'How much is my security deposit?', type: 'question', intent: 'deposit_status', roleScope: ['Renter'], priority: 75, status: 'enabled', version: '1.0' },
  { id: 'q-deposit-held', displayText: 'Why is my security deposit still being held?', type: 'question', intent: 'deposit_status', roleScope: ['Renter'], priority: 74, status: 'enabled', version: '1.0' },
  { id: 'q-deposit-release', displayText: 'When will my security deposit be released?', type: 'question', intent: 'deposit_status', roleScope: ['Renter'], priority: 73, status: 'enabled', version: '1.0' },
  { id: 'q-payment-charge', displayText: 'Why was money charged to my card?', type: 'question', intent: 'payment_inquiry', roleScope: ['Renter', 'Provider'], priority: 70, status: 'enabled', version: '1.0' },
  { id: 'q-payment-failed', displayText: 'My payment failed. What should I do?', type: 'question', intent: 'payment_issue', roleScope: ['Renter', 'Provider'], priority: 65, status: 'enabled', version: '1.0' },
  { id: 'q-refund-where', displayText: 'Where is my refund?', type: 'question', intent: 'refund_status', roleScope: ['Renter'], priority: 60, status: 'enabled', version: '1.0' },
  { id: 'q-refund-request', displayText: 'Can I get a refund?', type: 'question', intent: 'refund_request', roleScope: ['Renter'], priority: 55, status: 'enabled', version: '1.0' },
  { id: 'q-damage-report', displayText: 'How do I report damage?', type: 'question', intent: 'damage_report', roleScope: ['Renter', 'Provider'], priority: 50, status: 'enabled', version: '1.0' },
  { id: 'q-claim-status', displayText: 'What is the status of my claim or dispute?', type: 'question', intent: 'claim_status', roleScope: ['Renter', 'Provider'], priority: 45, status: 'enabled', version: '1.0' },
  { id: 'q-insurance', displayText: 'Does my rental have insurance?', type: 'question', intent: 'insurance_info', roleScope: ['Renter', 'Provider'], priority: 40, status: 'enabled', version: '1.0' },
  { id: 'q-kyc-pending', displayText: 'Why is my identity verification still pending?', type: 'question', intent: 'kyc_status', roleScope: ['Renter', 'Provider'], priority: 35, status: 'enabled', version: '1.0' },
  { id: 'q-listing-review', displayText: 'Why is my listing still under review?', type: 'question', intent: 'listing_status', roleScope: ['Provider'], priority: 30, status: 'enabled', version: '1.0' },
  { id: 'q-payout-where', displayText: 'Where is my payout?', type: 'question', intent: 'payout_status', roleScope: ['Provider'], priority: 25, status: 'enabled', version: '1.0' },
  { id: 'q-login-issue', displayText: 'I cannot log in. What should I do?', type: 'question', intent: 'login_help', roleScope: ['*'], priority: 20, status: 'enabled', version: '1.0' },
  { id: 'q-support-continuity', displayText: 'Will I lose my support conversation if I close the app?', type: 'question', intent: 'support_info', roleScope: ['*'], priority: 15, status: 'enabled', version: '1.0' },
  { id: 'q-device-continuity', displayText: 'Can I continue on another device?', type: 'question', intent: 'support_info', roleScope: ['*'], priority: 14, status: 'enabled', version: '1.0' },
  { id: 'q-human-agent', displayText: 'Can I talk to a human customer-service agent?', type: 'question', intent: 'support_info', roleScope: ['*'], priority: 13, status: 'enabled', version: '1.0' },
  { id: 'q-type-voice', displayText: 'Can I type instead of using voice?', type: 'question', intent: 'support_info', roleScope: ['*'], priority: 12, status: 'enabled', version: '1.0' },
  { id: 'q-dh-unavailable', displayText: 'What if Digital Human is unavailable?', type: 'question', intent: 'support_info', roleScope: ['*'], priority: 11, status: 'enabled', version: '1.0' },

  // Topics
  { id: 't-booking', displayText: 'Booking', type: 'topic', roleScope: ['*'], priority: 100, status: 'enabled', version: '1.0' },
  { id: 't-cancellation', displayText: 'Cancellation', type: 'topic', roleScope: ['*'], priority: 90, status: 'enabled', version: '1.0' },
  { id: 't-payment', displayText: 'Payment', type: 'topic', roleScope: ['*'], priority: 80, status: 'enabled', version: '1.0' },
  { id: 't-refund', displayText: 'Refund', type: 'topic', roleScope: ['*'], priority: 70, status: 'enabled', version: '1.0' },
  { id: 't-deposit', displayText: 'Deposit', type: 'topic', roleScope: ['Renter', 'Provider'], priority: 60, status: 'enabled', version: '1.0' },
  { id: 't-delivery', displayText: 'Delivery', type: 'topic', roleScope: ['*'], priority: 50, status: 'enabled', version: '1.0' },
  { id: 't-return', displayText: 'Return', type: 'topic', roleScope: ['*'], priority: 40, status: 'enabled', version: '1.0' },
  { id: 't-damage', displayText: 'Damage', type: 'topic', roleScope: ['*'], priority: 30, status: 'enabled', version: '1.0' },
  { id: 't-insurance', displayText: 'Insurance', type: 'topic', roleScope: ['*'], priority: 20, status: 'enabled', version: '1.0' },
  { id: 't-account', displayText: 'Account', type: 'topic', roleScope: ['*'], priority: 10, status: 'enabled', version: '1.0' },
];

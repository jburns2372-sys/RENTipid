export type RiskCeiling = 'INFORMATION' | 'PERSONALIZED' | 'ACTION';

export interface AiSpecialist {
  id: string;
  name: string;
  description: string;
  allowedIntents: string[];
  knowledgeDomains: string[];
  allowedTools: string[];
  riskCeiling: RiskCeiling;
  fallbackSpecialist?: string;
  status: 'enabled' | 'disabled';
  version: string;
}

export const aiSpecialistRegistry: Record<string, AiSpecialist> = {
  GENERAL_SUPPORT: {
    id: 'GENERAL_SUPPORT',
    name: 'General Support Specialist',
    description: 'Handles generic inquiries, navigation, and fallback questions.',
    allowedIntents: ['login_help', 'support_info'],
    knowledgeDomains: ['general_faq', 'platform_rules'],
    allowedTools: [],
    riskCeiling: 'INFORMATION',
    status: 'enabled',
    version: '1.0'
  },
  BOOKING: {
    id: 'BOOKING',
    name: 'Booking Specialist',
    description: 'Handles active and pending booking inquiries.',
    allowedIntents: ['booking_status', 'booking_acceptance', 'booking_cancel', 'booking_change'],
    knowledgeDomains: ['booking_policy'],
    allowedTools: ['get_booking_status', 'cancel_booking'],
    riskCeiling: 'ACTION',
    fallbackSpecialist: 'GENERAL_SUPPORT',
    status: 'enabled',
    version: '1.0'
  },
  PAYMENT_REFUND_DEPOSIT: {
    id: 'PAYMENT_REFUND_DEPOSIT',
    name: 'Financial Support Specialist',
    description: 'Handles inquiries regarding payments, deposits, and refunds.',
    allowedIntents: ['deposit_status', 'payment_inquiry', 'payment_issue', 'refund_status', 'refund_request'],
    knowledgeDomains: ['financial_policy'],
    allowedTools: ['get_payment_status', 'get_refund_status'],
    riskCeiling: 'PERSONALIZED',
    fallbackSpecialist: 'GENERAL_SUPPORT',
    status: 'enabled',
    version: '1.0'
  },
  RENTAL: {
    id: 'RENTAL',
    name: 'Rental Specialist',
    description: 'Handles active rental extensions and issues.',
    allowedIntents: ['rental_extend'],
    knowledgeDomains: ['rental_rules'],
    allowedTools: ['request_extension'],
    riskCeiling: 'ACTION',
    fallbackSpecialist: 'GENERAL_SUPPORT',
    status: 'enabled',
    version: '1.0'
  },
  CLAIM_DISPUTE: {
    id: 'CLAIM_DISPUTE',
    name: 'Case Specialist',
    description: 'Handles damage reports and disputes.',
    allowedIntents: ['damage_report', 'claim_status'],
    knowledgeDomains: ['dispute_policy'],
    allowedTools: ['get_claim_status', 'report_damage'],
    riskCeiling: 'ACTION',
    fallbackSpecialist: 'GENERAL_SUPPORT',
    status: 'enabled',
    version: '1.0'
  },
  INSURANCE: {
    id: 'INSURANCE',
    name: 'Insurance Specialist',
    description: 'Handles insurance inquiries.',
    allowedIntents: ['insurance_info'],
    knowledgeDomains: ['insurance_terms'],
    allowedTools: [],
    riskCeiling: 'INFORMATION',
    fallbackSpecialist: 'GENERAL_SUPPORT',
    status: 'enabled',
    version: '1.0'
  },
  KYC_ACCOUNT: {
    id: 'KYC_ACCOUNT',
    name: 'Account Specialist',
    description: 'Handles identity and account status inquiries.',
    allowedIntents: ['kyc_status'],
    knowledgeDomains: ['account_policy'],
    allowedTools: ['get_kyc_status'],
    riskCeiling: 'PERSONALIZED',
    fallbackSpecialist: 'GENERAL_SUPPORT',
    status: 'enabled',
    version: '1.0'
  },
  PROVIDER: {
    id: 'PROVIDER',
    name: 'Provider Specialist',
    description: 'Handles provider-specific dashboard and listing queries.',
    allowedIntents: ['listing_status', 'payout_status'],
    knowledgeDomains: ['provider_policy'],
    allowedTools: ['get_listing_status', 'get_payout_status'],
    riskCeiling: 'PERSONALIZED',
    fallbackSpecialist: 'GENERAL_SUPPORT',
    status: 'enabled',
    version: '1.0'
  }
};

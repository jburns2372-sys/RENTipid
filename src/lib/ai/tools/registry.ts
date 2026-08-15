import { AiToolGateway, ToolDefinition } from './AiToolGateway';
import { AiPolicyEngine } from '../policy/AiPolicyEngine';
import { socialDomainTools } from './social-registry';
import { executeMarketplaceAnalyticsQueryTool } from './marketplace-registry';

const policyEngine = AiPolicyEngine.getInstance();

// Mock DB interactions for test purposes
const mockDb = {
  bookings: [{ id: 'bk_123', userId: 'test_user', status: 'CONFIRMED' }],
  listings: [{ id: 'lst_123', ownerId: 'test_user', title: 'Power Drill' }]
};

export const getBookingTool: ToolDefinition = {
  name: 'getBooking',
  riskClass: 'READ_ONLY',
  description: 'Fetch booking details',
  allowedRoles: ['Renter', 'Provider', 'Admin'],
  handler: async (args: { bookingId: string }, context) => {
    const booking = mockDb.bookings.find(b => b.id === args.bookingId);
    if (!booking) throw new Error('Booking not found');
    
    // Ownership Enforcement
    if (booking.userId !== context.userId) {
      throw new Error('Ownership denial: Not your booking');
    }
    
    return booking;
  }
};

export const cancelBookingTool: ToolDefinition = {
  name: 'cancelBooking',
  riskClass: 'CONFIRMED_ACTION',
  description: 'Cancel an existing booking',
  allowedRoles: ['Renter'],
  requiresConfirmation: true,
  requiresPolicy: true,
  handler: async (args: { bookingId: string, hoursUntilStart: number, bookingState: string }, context) => {
    const booking = mockDb.bookings.find(b => b.id === args.bookingId);
    if (!booking) throw new Error('Booking not found');
    
    // Ownership Enforcement
    if (booking.userId !== context.userId) {
      throw new Error('Ownership denial: Not your booking');
    }
    
    // Policy Engine Enforcement
    const policyResult = await policyEngine.evaluateCancellation(args.bookingId, args.hoursUntilStart, args.bookingState);
    if (policyResult.safeHold) {
      throw new Error(`SAFE_HOLD: ${policyResult.reasonCode}. Generative override denied.`);
    }
    if (policyResult.decision !== 'approved') {
      throw new Error(`Cancellation denied: ${policyResult.reasonCode}`);
    }

    // Mutation
    booking.status = 'CANCELLED';
    
    // Post-action verification
    const verifiedBooking = mockDb.bookings.find(b => b.id === args.bookingId);
    if (verifiedBooking?.status !== 'CANCELLED') {
      throw new Error('Post-action verification failed');
    }
    
    return { success: true, bookingId: args.bookingId, status: 'CANCELLED', refundAmount: policyResult.calculatedAmount };
  }
};

export const adminOnlyTool: ToolDefinition = {
  name: 'adminOnlyTool',
  riskClass: 'READ_ONLY',
  description: 'Admin tool',
  allowedRoles: ['Admin'],
  handler: async () => ({ secret: 'admin_data' })
};

export const prohibitedTool: ToolDefinition = {
  name: 'prohibitedTool',
  riskClass: 'PROHIBITED',
  description: 'Banned tool',
  allowedRoles: ['Renter', 'Provider', 'Admin'],
  handler: async () => ({})
};

// --- P9 Tools ---
const mockDomainDb = {
  claims: [{ id: 'cl_123', userId: 'test_user', amount: 500 }],
  disputes: [{ id: 'ds_123', userId: 'test_user', amount: 300 }],
  users: [{ id: 'test_user', kycStatus: 'VERIFIED' }],
  insurance: [{ id: 'pol_123', userId: 'test_user', status: 'ACTIVE' }]
};

export const submitClaimTool: ToolDefinition = {
  name: 'submitClaim',
  riskClass: 'CASE_ACTION',
  description: 'Submit or update a claim',
  allowedRoles: ['Renter', 'Provider'],
  requiresPolicy: true,
  handler: async (args: { claimId: string, evidenceComplete: boolean, evidenceConflict: boolean }, context) => {
    const claim = mockDomainDb.claims.find(c => c.id === args.claimId);
    if (!claim) throw new Error('Claim not found');
    if (claim.userId !== context.userId) throw new Error('Ownership denial: Not your claim');

    const result = await policyEngine.evaluateClaim(args.claimId, args.evidenceComplete, args.evidenceConflict, claim.amount);
    
    if (result.safeHold) {
      throw new Error(`SAFE_HOLD: ${result.reasonCode}`);
    }
    
    return { success: true, decision: result.decision, reasonCode: result.reasonCode, amount: result.calculatedAmount };
  }
};

export const submitDisputeTool: ToolDefinition = {
  name: 'submitDispute',
  riskClass: 'CASE_ACTION',
  description: 'Submit or update a dispute',
  allowedRoles: ['Renter', 'Provider'],
  requiresPolicy: true,
  handler: async (args: { disputeId: string, evidenceComplete: boolean, evidenceConflict: boolean }, context) => {
    const dispute = mockDomainDb.disputes.find(d => d.id === args.disputeId);
    if (!dispute) throw new Error('Dispute not found');
    if (dispute.userId !== context.userId) throw new Error('Ownership denial: Not your dispute');

    const result = await policyEngine.evaluateDispute(args.disputeId, args.evidenceComplete, args.evidenceConflict, dispute.amount);
    
    if (result.safeHold) {
      throw new Error(`SAFE_HOLD: ${result.reasonCode}`);
    }
    
    return { success: true, decision: result.decision, reasonCode: result.reasonCode };
  }
};

export const checkKycTool: ToolDefinition = {
  name: 'checkKyc',
  riskClass: 'READ_ONLY',
  description: 'Retrieve KYC status securely',
  allowedRoles: ['Renter', 'Provider'],
  requiresPolicy: true,
  handler: async (args: {}, context) => {
    const user = mockDomainDb.users.find(u => u.id === context.userId);
    const providerStatus = user ? user.kycStatus : 'UNKNOWN';
    
    const result = await policyEngine.evaluateKyc(context.userId, providerStatus);
    
    // AI cannot invent identity, must return mapped result
    return { success: true, status: result.reasonCode };
  }
};

export const approveKycTool: ToolDefinition = {
  name: 'approveKyc',
  riskClass: 'PROHIBITED', // AI cannot approve identity
  description: 'Approve KYC status (PROHIBITED FOR AI)',
  allowedRoles: ['Admin'],
  handler: async () => { throw new Error('AI Identity Approval: PROHIBITED'); }
};

export const getInsuranceTool: ToolDefinition = {
  name: 'getInsurance',
  riskClass: 'READ_ONLY',
  description: 'Retrieve insurance status',
  allowedRoles: ['Renter', 'Provider'],
  requiresPolicy: true,
  handler: async (args: { policyId: string }, context) => {
    const pol = mockDomainDb.insurance.find(p => p.id === args.policyId);
    if (!pol) throw new Error('Policy not found');
    if (pol.userId !== context.userId) throw new Error('Ownership denial: Not your policy');

    const result = await policyEngine.evaluateInsurance(args.policyId, pol.status);
    
    if (result.safeHold) {
      throw new Error(`SAFE_HOLD: ${result.reasonCode}`);
    }

    return { success: true, status: result.reasonCode };
  }
};

export function registerAllTools(gateway: AiToolGateway) {
  gateway.registerTool(getBookingTool);
  gateway.registerTool(cancelBookingTool);
  gateway.registerTool(adminOnlyTool);
  gateway.registerTool(prohibitedTool);
  gateway.registerTool(submitClaimTool);
  gateway.registerTool(submitDisputeTool);
  gateway.registerTool(checkKycTool);
  gateway.registerTool(approveKycTool);
  gateway.registerTool(getInsuranceTool);
  
  // Register Social Tools
  socialDomainTools.forEach(tool => gateway.registerTool(tool));

  // Register Marketplace Analytics
  gateway.registerTool(executeMarketplaceAnalyticsQueryTool);
}

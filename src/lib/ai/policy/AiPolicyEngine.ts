import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface PolicyResult {
  decision: 'approved' | 'denied' | 'hold';
  eligibility: boolean;
  reasonCode: string;
  policyVersion: string;
  calculatedAmount?: number;
  requiredConfirmation: boolean;
  requiredStepUp: boolean;
  safeHold: boolean;
  nextAction?: string;
}

export class AiPolicyEngine {
  private static instance = new AiPolicyEngine();
  private readonly CURRENT_POLICY_VERSION = 'v1.1';

  static getInstance() {
    return this.instance;
  }

  // --- Core Deterministic Handlers ---

  async evaluateCancellation(bookingId: string, hoursUntilStart: number, bookingState: string): Promise<PolicyResult> {
    const inputs = { bookingId, hoursUntilStart, bookingState };
    
    let result: PolicyResult;
    
    // SAFE HOLD conditions
    if (bookingState === 'DISPUTED' || bookingState === 'UNKNOWN') {
      result = this.createSafeHold('STATE_CONFLICT_OR_UNKNOWN');
    } 
    // Approved cancellation
    else if (hoursUntilStart > 24 && bookingState === 'CONFIRMED') {
      result = {
        decision: 'approved',
        eligibility: true,
        reasonCode: 'CANCEL_ALLOWED_24H',
        policyVersion: this.CURRENT_POLICY_VERSION,
        calculatedAmount: 100, // e.g. 100% refund
        requiredConfirmation: true,
        requiredStepUp: false,
        safeHold: false,
        nextAction: 'CONFIRM_CANCELLATION'
      };
    } 
    // Denied cancellation
    else {
      result = {
        decision: 'denied',
        eligibility: false,
        reasonCode: 'CANCEL_DENIED_LATE',
        policyVersion: this.CURRENT_POLICY_VERSION,
        calculatedAmount: 0,
        requiredConfirmation: false,
        requiredStepUp: false,
        safeHold: false,
        nextAction: 'EXPLAIN_POLICY'
      };
    }

    await this.recordDecision('Cancellation', inputs, result);
    return result;
  }

  async evaluateRescheduling(bookingId: string, newDate: string, isAvailable: boolean): Promise<PolicyResult> {
    const inputs = { bookingId, newDate, isAvailable };
    
    let result: PolicyResult;
    
    if (!isAvailable) {
      result = {
        decision: 'denied',
        eligibility: false,
        reasonCode: 'RESCHEDULE_UNAVAILABLE_DATE',
        policyVersion: this.CURRENT_POLICY_VERSION,
        requiredConfirmation: false,
        requiredStepUp: false,
        safeHold: false,
        nextAction: 'SELECT_NEW_DATE'
      };
    } else {
      result = {
        decision: 'approved',
        eligibility: true,
        reasonCode: 'RESCHEDULE_ALLOWED',
        policyVersion: this.CURRENT_POLICY_VERSION,
        calculatedAmount: 10, // $10 change fee
        requiredConfirmation: true,
        requiredStepUp: false,
        safeHold: false,
        nextAction: 'CONFIRM_RESCHEDULE'
      };
    }

    await this.recordDecision('Rescheduling', inputs, result);
    return result;
  }

  async evaluateRefund(transactionId: string, amount: number, faultCategory: string): Promise<PolicyResult> {
    const inputs = { transactionId, amount, faultCategory };
    let result: PolicyResult;
    
    if (faultCategory === 'PROVIDER_FAULT') {
      result = {
        decision: 'approved',
        eligibility: true,
        reasonCode: 'REFUND_PROVIDER_FAULT',
        policyVersion: this.CURRENT_POLICY_VERSION,
        calculatedAmount: amount,
        requiredConfirmation: true,
        requiredStepUp: amount > 500, // Step-up required if > $500
        safeHold: false
      };
    } else if (faultCategory === 'RENTER_FAULT') {
      result = {
        decision: 'denied',
        eligibility: false,
        reasonCode: 'REFUND_DENIED_RENTER_FAULT',
        policyVersion: this.CURRENT_POLICY_VERSION,
        calculatedAmount: 0,
        requiredConfirmation: false,
        requiredStepUp: false,
        safeHold: false
      };
    } else {
      result = this.createSafeHold('UNKNOWN_FAULT_CATEGORY');
    }

    await this.recordDecision('Refund', inputs, result);
    return result;
  }

  async evaluateFeesDeposits(itemId: string, itemValue: number, userRiskScore: number): Promise<PolicyResult> {
    const inputs = { itemId, itemValue, userRiskScore };
    let result: PolicyResult;

    if (userRiskScore > 80) {
      result = {
        decision: 'approved',
        eligibility: true,
        reasonCode: 'HIGH_RISK_DEPOSIT',
        policyVersion: this.CURRENT_POLICY_VERSION,
        calculatedAmount: itemValue * 0.2, // 20% deposit
        requiredConfirmation: false,
        requiredStepUp: true,
        safeHold: false
      };
    } else {
      result = {
        decision: 'approved',
        eligibility: true,
        reasonCode: 'STANDARD_DEPOSIT',
        policyVersion: this.CURRENT_POLICY_VERSION,
        calculatedAmount: itemValue * 0.1, // 10% deposit
        requiredConfirmation: false,
        requiredStepUp: false,
        safeHold: false
      };
    }

    await this.recordDecision('FeesDeposits', inputs, result);
    return result;
  }

  // --- P9 Claims, Disputes, KYC, Insurance ---

  async evaluateClaim(claimId: string, evidenceComplete: boolean, evidenceConflict: boolean, amount: number): Promise<PolicyResult> {
    const inputs = { claimId, evidenceComplete, evidenceConflict, amount };
    let result: PolicyResult;

    if (evidenceConflict) {
      result = this.createSafeHold('CLAIM_EVIDENCE_CONFLICT');
    } else if (!evidenceComplete) {
      result = this.createSafeHold('CLAIM_EVIDENCE_INCOMPLETE');
    } else if (amount > 1000) { // Deterministic threshold e.g. max $1000 auto-settlement
      result = {
        decision: 'hold',
        eligibility: false,
        reasonCode: 'CLAIM_EXCEEDS_AUTO_THRESHOLD',
        policyVersion: this.CURRENT_POLICY_VERSION,
        requiredConfirmation: false,
        requiredStepUp: true,
        safeHold: true,
        nextAction: 'ESCALATE_TO_EXTERNAL_PROCESS'
      };
    } else {
      result = {
        decision: 'approved',
        eligibility: true,
        reasonCode: 'CLAIM_AUTO_SETTLED',
        policyVersion: this.CURRENT_POLICY_VERSION,
        calculatedAmount: amount,
        requiredConfirmation: true,
        requiredStepUp: false,
        safeHold: false
      };
    }

    await this.recordDecision('Claim', inputs, result);
    return result;
  }

  async evaluateDispute(disputeId: string, evidenceComplete: boolean, evidenceConflict: boolean, amount: number): Promise<PolicyResult> {
    // Reuses similar logic to claim for simplicity in this mock, but distinct policy family
    const inputs = { disputeId, evidenceComplete, evidenceConflict, amount };
    let result: PolicyResult;

    if (evidenceConflict) {
      result = this.createSafeHold('DISPUTE_EVIDENCE_CONFLICT');
    } else if (!evidenceComplete) {
      result = this.createSafeHold('DISPUTE_EVIDENCE_INCOMPLETE');
    } else if (amount > 500) { // Dispute threshold
      result = this.createSafeHold('DISPUTE_EXCEEDS_AUTO_THRESHOLD');
    } else {
      result = {
        decision: 'approved',
        eligibility: true,
        reasonCode: 'DISPUTE_AUTO_SETTLED',
        policyVersion: this.CURRENT_POLICY_VERSION,
        calculatedAmount: amount,
        requiredConfirmation: true,
        requiredStepUp: false,
        safeHold: false
      };
    }

    await this.recordDecision('Dispute', inputs, result);
    return result;
  }

  async evaluateKyc(userId: string, providerStatus: string): Promise<PolicyResult> {
    const inputs = { userId, providerStatus };
    let result: PolicyResult;

    if (providerStatus === 'VERIFIED') {
      result = { decision: 'approved', eligibility: true, reasonCode: 'KYC_VERIFIED', policyVersion: this.CURRENT_POLICY_VERSION, requiredConfirmation: false, requiredStepUp: false, safeHold: false };
    } else if (providerStatus === 'REJECTED') {
      result = { decision: 'denied', eligibility: false, reasonCode: 'KYC_REJECTED', policyVersion: this.CURRENT_POLICY_VERSION, requiredConfirmation: false, requiredStepUp: false, safeHold: false };
    } else {
      result = this.createSafeHold('KYC_UNKNOWN_STATUS');
    }
    await this.recordDecision('KYC', inputs, result);
    return result;
  }

  async evaluateInsurance(policyId: string, providerCoverageStatus: string): Promise<PolicyResult> {
    const inputs = { policyId, providerCoverageStatus };
    let result: PolicyResult;

    if (providerCoverageStatus === 'ACTIVE') {
      result = { decision: 'approved', eligibility: true, reasonCode: 'INSURANCE_ACTIVE', policyVersion: this.CURRENT_POLICY_VERSION, requiredConfirmation: false, requiredStepUp: false, safeHold: false };
    } else {
      result = this.createSafeHold('INSURANCE_INACTIVE_OR_UNKNOWN');
    }
    await this.recordDecision('Insurance', inputs, result);
    return result;
  }

  // --- Helper Methods ---

  private createSafeHold(reasonCode: string): PolicyResult {
    return {
      decision: 'hold',
      eligibility: false,
      reasonCode,
      policyVersion: this.CURRENT_POLICY_VERSION,
      requiredConfirmation: false,
      requiredStepUp: false,
      safeHold: true,
      nextAction: 'ESCALATE_TO_CASE'
    };
  }

  private hashData(data: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  private async recordDecision(policyType: string, inputs: any, result: PolicyResult) {
    const inputHash = this.hashData(inputs);
    // Persist to database using P3 AiPolicyDecision model
    await prisma.aiPolicyDecision.create({
      data: {
        policyType,
        policyVersion: result.policyVersion,
        inputHash,
        decision: result.decision,
        reasonCode: result.reasonCode,
        resultData: result as any
      }
    });
  }
}

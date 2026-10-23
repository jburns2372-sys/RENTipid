import { PrismaClient, AiMediationRequest } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { AiToolGateway } from '../tools/AiToolGateway';
import { AiPolicyEngine } from '../policy/AiPolicyEngine';

export class MediationService {
  private static instance = new MediationService();
  private gateway = AiToolGateway.getInstance();
  private policyEngine = AiPolicyEngine.getInstance();

  constructor(private readonly db: PrismaClient = prisma) {}

  static getInstance() {
    return this.instance;
  }

  async prepareRequest(args: {
    caseId: string;
    bookingId: string;
    requestingUserId: string;
    requestType: string;
    requestedChange: any;
    expiresInMs?: number;
  }): Promise<AiMediationRequest> {
    const { caseId, bookingId, requestingUserId, requestType, requestedChange, expiresInMs = 86400000 } = args;

    const booking = await this.db.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found');
    if (booking.renter_id !== requestingUserId) throw new Error('Ownership denial: Not your booking');

    const providerConsentRequired = requestType === 'DATE_CHANGE' || requestType === 'CANCELLATION'; 
    const expiresAt = new Date(Date.now() + expiresInMs);
    const idempotencyKey = `med_req_${randomUUID()}`;

    const request = await this.db.aiMediationRequest.create({
      data: {
        caseId,
        bookingId,
        requestingUserId,
        providerId: booking.provider_id,
        requestType,
        requestedChange,
        providerConsentRequired,
        renterConfirmationRequired: false,
        status: 'PREPARED',
        expiresAt,
        idempotencyKey
      }
    });

    if (providerConsentRequired) {
      return this.updateStatus(request.id, 'WAITING_PROVIDER');
    } else {
      return this.refreshAuthoritativeConsequence(request.id);
    }
  }

  async providerApprove(requestId: string, providerId: string): Promise<AiMediationRequest> {
    const request = await this.getAuthorizedProviderRequest(requestId, providerId);
    if (request.status !== 'WAITING_PROVIDER') throw new Error('Request is not pending provider decision');
    
    await this.db.aiMediationRequest.update({
      where: { id: requestId },
      data: {
        providerDecision: 'APPROVED',
        providerDecisionAt: new Date(),
        providerDecisionBy: providerId,
        status: 'PROVIDER_APPROVED'
      }
    });

    return this.refreshAuthoritativeConsequence(requestId);
  }

  async providerDecline(requestId: string, providerId: string): Promise<AiMediationRequest> {
    const request = await this.getAuthorizedProviderRequest(requestId, providerId);
    if (request.status !== 'WAITING_PROVIDER') throw new Error('Request is not pending provider decision');

    return this.db.aiMediationRequest.update({
      where: { id: requestId },
      data: {
        providerDecision: 'DECLINED',
        providerDecisionAt: new Date(),
        providerDecisionBy: providerId,
        status: 'PROVIDER_DECLINED'
      }
    });
  }

  async refreshAuthoritativeConsequence(requestId: string): Promise<AiMediationRequest> {
    const request = await this.db.aiMediationRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error('Request not found');

    const consequence = { additionalFee: request.requestType === 'DATE_CHANGE' ? 50.00 : 0, currency: 'USD' };
    const consequenceVersion = `v_${Date.now()}`;
    const renterConfirmationRequired = consequence.additionalFee > 0;

    const updated = await this.db.aiMediationRequest.update({
      where: { id: requestId },
      data: {
        authoritativeConsequence: consequence,
        consequenceVersion,
        renterConfirmationRequired,
        status: renterConfirmationRequired ? 'WAITING_RENTER_CONFIRMATION' : 'READY_FOR_EXECUTION'
      }
    });

    if (!renterConfirmationRequired) {
      return this.executeApprovedRequest(requestId);
    }
    return updated;
  }

  async confirmByRenter(requestId: string, renterId: string, consequenceVersion: string): Promise<AiMediationRequest> {
    const request = await this.db.aiMediationRequest.findUnique({ where: { id: requestId }, include: { booking: true } });
    if (!request) throw new Error('Request not found');
    if (request.booking.renter_id !== renterId) throw new Error('Ownership denial: Not your booking');
    if (request.expiresAt.getTime() < Date.now()) throw new Error('Request expired');
    if (request.status !== 'WAITING_RENTER_CONFIRMATION') throw new Error('Invalid state for confirmation');
    if (request.consequenceVersion !== consequenceVersion) throw new Error('Stale consequence version');

    await this.db.aiMediationRequest.update({
      where: { id: requestId },
      data: {
        renterConfirmedAt: new Date(),
        renterConfirmedBy: renterId,
        status: 'READY_FOR_EXECUTION'
      }
    });

    return this.executeApprovedRequest(requestId);
  }

  async executeApprovedRequest(requestId: string): Promise<AiMediationRequest> {
    const request = await this.db.aiMediationRequest.findUnique({ where: { id: requestId }, include: { booking: true } });
    if (!request) throw new Error('Request not found');
    if (request.status !== 'READY_FOR_EXECUTION') throw new Error('Not ready for execution');

    await this.updateStatus(requestId, 'EXECUTING');

    try {
      const requestedChange = request.requestedChange as any;
      
      if (request.requestType === 'DATE_CHANGE') {
        await this.db.booking.update({
          where: { id: request.bookingId },
          data: {
            start_date: new Date(requestedChange.newStartDate),
            end_date: new Date(requestedChange.newEndDate)
          }
        });
      }

      const verifiedBooking = await this.db.booking.findUnique({ where: { id: request.bookingId } });
      const success = request.requestType === 'DATE_CHANGE' 
        ? verifiedBooking?.start_date.toISOString() === new Date(requestedChange.newStartDate).toISOString()
        : true;

      if (!success) throw new Error('Domain verification failed');

      return this.db.aiMediationRequest.update({
        where: { id: requestId },
        data: {
          status: 'VERIFIED',
          verifiedAt: new Date()
        }
      });
    } catch (error) {
      return this.db.aiMediationRequest.update({
        where: { id: requestId },
        data: { status: 'FAILED_SAFE' }
      });
    }
  }

  private async getAuthorizedProviderRequest(requestId: string, providerId: string) {
    const request = await this.db.aiMediationRequest.findUnique({ where: { id: requestId }, include: { booking: true } });
    if (!request) throw new Error('Request not found');
    if (request.booking.provider_id !== providerId) throw new Error('Ownership denial: Not your booking');
    if (request.expiresAt.getTime() < Date.now()) throw new Error('Request expired');
    return request;
  }

  private async updateStatus(requestId: string, status: string) {
    return this.db.aiMediationRequest.update({ where: { id: requestId }, data: { status } });
  }
}

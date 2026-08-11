import { PrismaClient } from '@prisma/client';
import { ProhibitedItemsService } from '../../../../src/lib/prohibited-items/prohibited-items.service';
import { logAuditAction } from './auditService';

const prisma = new PrismaClient();

export class ListingService {
  /**
   * Evaluates the listing against the Prohibited Items Policy.
   * Throws an error if the listing is blocked or requires a hold, preventing mutation.
   */
  private static async enforcePolicy(
    listingId: string,
    providerUserId: string,
    title: string,
    description: string,
    source: string
  ) {
    const evaluation = await ProhibitedItemsService.createPolicyEvaluation({
      listingId,
      providerUserId,
      evaluationSource: source,
      submittedTitle: title,
      submittedDescription: description || '',
    });

    if (['BLOCK', 'HOLD_FOR_REVIEW', 'REQUIRE_DOCUMENTS', 'TAKEDOWN', 'ESCALATE'].includes(evaluation.decision)) {
      // Safe failure
      throw new Error(`POLICY_VIOLATION:${evaluation.userSafeReason}`);
    }

    return evaluation;
  }

  static async createDraft(providerId: string, data: any) {
    // Basic Draft validation
    const title = data.title || 'Untitled Draft';
    const description = data.description || '';

    // Create record first with safe defaults to get an ID for policy evaluation,
    // or evaluate first using a dummy ID? We'll create it first in a transaction,
    // but Prisma doesn't support calling external services inside a tx easily if it's long running.
    // Actually, ProhibitedItemsService creates evaluation records. 
    // Let's create the listing in Draft, then evaluate. If blocked, we can either delete it or hold it.
    // Requirement: "Hold the listing. Do not publish." 

    let listing = await prisma.listing.create({
      data: {
        provider_id: providerId,
        category_id: data.category_id,
        title: title,
        description: description,
        rental_type: data.rental_type || 'Daily',
        status: 'Draft',
        // default pricing
        daily_rate: data.daily_rate ? parseFloat(data.daily_rate) : 0,
      }
    });

    try {
      await this.enforcePolicy(listing.id, providerId, title, description, 'DRAFT_CREATION');
    } catch (error: any) {
      if (error.message.startsWith('POLICY_VIOLATION:')) {
        // Enforce HOLD
        listing = await prisma.listing.update({
          where: { id: listing.id },
          data: { status: 'Under Review' },
        });
        throw new Error(error.message.split(':')[1]);
      }
      throw error;
    }

    await logAuditAction(providerId, 'LISTING_DRAFT_CREATED', listing.id, { title });
    return listing;
  }

  static async getListing(listingId: string, userId: string) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new Error('Not found');
    if (listing.provider_id !== userId) throw new Error('Unauthorized');
    return listing;
  }

  static async updateDraft(listingId: string, providerId: string, data: any) {
    const listing = await this.getListing(listingId, providerId);
    
    if (!['Draft', 'Rejected'].includes(listing.status)) {
      throw new Error('Cannot update listing in current status');
    }

    const title = data.title !== undefined ? data.title : listing.title;
    const description = data.description !== undefined ? data.description : (listing.description || '');

    try {
      await this.enforcePolicy(listing.id, providerId, title, description, 'DRAFT_UPDATE');
    } catch (error: any) {
      if (error.message.startsWith('POLICY_VIOLATION:')) {
        await prisma.listing.update({
          where: { id: listing.id },
          data: { status: 'Under Review' },
        });
        throw new Error(error.message.split(':')[1]);
      }
      throw error;
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: {
        title,
        description,
        category_id: data.category_id || listing.category_id,
        location: data.location,
        city: data.city,
        province: data.province,
        country: data.country,
        rental_type: data.rental_type || listing.rental_type,
        hourly_rate: data.hourly_rate ? parseFloat(data.hourly_rate) : null,
        daily_rate: data.daily_rate ? parseFloat(data.daily_rate) : null,
        weekly_rate: data.weekly_rate ? parseFloat(data.weekly_rate) : null,
        monthly_rate: data.monthly_rate ? parseFloat(data.monthly_rate) : null,
        security_deposit: data.security_deposit ? parseFloat(data.security_deposit) : null,
        replacement_value: data.replacement_value ? parseFloat(data.replacement_value) : null,
        quantity: data.quantity ? parseInt(data.quantity) : 1,
        condition: data.condition,
        pickup_available: data.pickup_available,
        delivery_available: data.delivery_available,
        delivery_fee: data.delivery_fee ? parseFloat(data.delivery_fee) : null,
        min_duration: data.min_duration ? parseInt(data.min_duration) : null,
        max_duration: data.max_duration ? parseInt(data.max_duration) : null,
        rules: data.rules,
      }
    });

    await logAuditAction(providerId, 'LISTING_DRAFT_UPDATED', listing.id, { title });
    return updated;
  }

  static async submitListing(listingId: string, providerId: string) {
    const listing = await this.getListing(listingId, providerId);
    
    if (!['Draft', 'Rejected'].includes(listing.status)) {
      throw new Error('Listing is not in a submittable state');
    }

    try {
      await this.enforcePolicy(listing.id, providerId, listing.title, listing.description || '', 'SUBMISSION');
    } catch (error: any) {
      if (error.message.startsWith('POLICY_VIOLATION:')) {
        await prisma.listing.update({
          where: { id: listing.id },
          data: { status: 'Under Review' },
        });
        throw new Error(error.message.split(':')[1]);
      }
      throw error;
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'Submitted for Review' }
    });

    await logAuditAction(providerId, 'LISTING_SUBMITTED', listing.id, { title: listing.title });
    return updated;
  }

  static async approveListing(listingId: string, adminId: string) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new Error('Not found');

    if (listing.status !== 'Submitted for Review' && listing.status !== 'Under Review') {
      throw new Error('Listing is not pending review');
    }

    try {
      await this.enforcePolicy(listing.id, listing.provider_id, listing.title, listing.description || '', 'APPROVAL');
    } catch (error: any) {
      if (error.message.startsWith('POLICY_VIOLATION:')) {
        await prisma.listing.update({
          where: { id: listing.id },
          data: { status: 'Under Review' },
        });
        throw new Error(error.message.split(':')[1]);
      }
      throw error;
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'Approved' }
    });

    await logAuditAction(adminId, 'LISTING_APPROVED', listing.id, { title: listing.title });
    return updated;
  }

  static async publishListing(listingId: string, adminId: string) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new Error('Not found');

    if (listing.status !== 'Approved') {
      throw new Error('Listing must be approved before publication');
    }

    try {
      await this.enforcePolicy(listing.id, listing.provider_id, listing.title, listing.description || '', 'PUBLICATION');
    } catch (error: any) {
      if (error.message.startsWith('POLICY_VIOLATION:')) {
        await prisma.listing.update({
          where: { id: listing.id },
          data: { status: 'Under Review' },
        });
        throw new Error(error.message.split(':')[1]);
      }
      throw error;
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'Published', published_at: new Date() }
    });

    await logAuditAction(adminId, 'LISTING_PUBLISHED', listing.id, { title: listing.title });
    return updated;
  }
  static async withdrawListing(listingId: string, providerId: string) {
    const listing = await this.getListing(listingId, providerId);
    if (listing.status !== 'Submitted for Review') {
      throw new Error('Can only withdraw listings that are submitted for review');
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'Draft' }
    });
    
    await logAuditAction(providerId, 'LISTING_WITHDRAWN', listing.id, { title: listing.title });
    return updated;
  }

  static async rejectListing(listingId: string, adminId: string, reason: string) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new Error('Not found');
    if (listing.status !== 'Submitted for Review' && listing.status !== 'Under Review') {
      throw new Error('Listing is not pending review');
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'Rejected' }
    });

    await logAuditAction(adminId, 'LISTING_REJECTED', listing.id, { reason });
    return updated;
  }

  static async unpublishListing(listingId: string, adminId: string) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new Error('Not found');
    if (listing.status !== 'Published') {
      throw new Error('Listing is not published');
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'Approved', published_at: null }
    });

    await logAuditAction(adminId, 'LISTING_UNPUBLISHED', listing.id, { title: listing.title });
    return updated;
  }

  static async getReviewQueue(adminId: string) {
    // Basic review queue query
    return await prisma.listing.findMany({
      where: {
        status: { in: ['Submitted for Review', 'Under Review'] }
      },
      orderBy: { created_at: 'asc' }
    });
  }
}

import { PrismaClient } from '@prisma/client';
import { SOCIAL_PERMISSIONS, hasSocialPermission } from './social-permissions';

const prisma = new PrismaClient();

export class SocialApprovalService {
  /**
   * Approves a social post draft that is in SUBMITTED_FOR_REVIEW state.
   */
  static async approvePost({
    postId,
    reviewerId,
    reviewerRole,
    versionNumber,
    comment,
    overrideReason,
  }: {
    postId: string;
    reviewerId: string;
    reviewerRole: string;
    versionNumber: number;
    comment?: string;
    overrideReason?: string;
  }) {
    if (!hasSocialPermission(reviewerRole, SOCIAL_PERMISSIONS.APPROVE)) {
      throw new Error('Insufficient permissions to approve content');
    }

    const post = await prisma.marketingPost.findUnique({
      where: { id: postId },
      include: {
        versions: {
          where: { version_number: versionNumber }
        }
      }
    });

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.post_status !== 'SUBMITTED_FOR_REVIEW') {
      throw new Error('Post is not in SUBMITTED_FOR_REVIEW state');
    }

    // Segregation of Duties: Author cannot be Approver
    let isSelfApprovalOverride = false;
    if (post.created_by_id === reviewerId) {
      if (reviewerRole !== 'Super Admin') {
        throw new Error('Author cannot approve their own content');
      }
      if (!overrideReason || overrideReason.trim().length === 0) {
        throw new Error('SuperAdmin self-approval requires a valid override reason');
      }
      isSelfApprovalOverride = true;
    }

    const version = post.versions[0];
    if (!version) {
      throw new Error('Version mismatch: The version requested for approval does not exist.');
    }

    if (post.target_account_id) {
       const account = await prisma.socialAccount.findUnique({ where: { id: post.target_account_id } });
       if (!account) throw new Error('Target account not found');
       if (account.health_status === 'DISABLED') throw new Error('Target account is disabled');
    }

    // Execute approval inside a transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Create the immutable review record
      const review = await tx.marketingPostReview.create({
        data: {
          post_id: postId,
          post_version_id: version.id,
          version_number: versionNumber,
          reviewer_id: reviewerId,
          decision: 'APPROVED',
          comment,
          override_reason: overrideReason,
          self_approval_override: isSelfApprovalOverride,
        }
      });

      // 2. Update post status to APPROVED
      await tx.marketingPost.update({
        where: { id: postId },
        data: {
          post_status: 'APPROVED',
          updated_at: new Date(),
        }
      });

      // 3. Log security event (Audit trail)
      await tx.securityEvent.create({
        data: {
          source_type: 'AUDIT_LOG',
          security_domain: 'APPLICATION_RELIABILITY',
          source_record_id: review.id,
          actor_user_id: reviewerId,
          target_module: 'MarketingPost',
          target_resource_id: postId,
          severity: 'LOW',
          event_category: 'AUTHORIZATION',
          event_classification: 'OBSERVATION',
          environment: 'TEST',
          lifecycle_type: 'TEST',
          occurred_at: new Date(),
          source_received_at: new Date(),
          event_code: isSelfApprovalOverride ? 'P6_SELF_APPROVAL_OVERRIDE' : 'P6_POST_APPROVED',
          idempotency_key: `soc_appr_${review.id}_${Date.now()}`,
          source_summary: JSON.stringify({ 
            versionNumber, 
            reviewId: review.id, 
            self_approval_override: isSelfApprovalOverride,
            override_reason: overrideReason
          }),
        }
      });

      return review;
    });
  }

  /**
   * Rejects a social post draft that is in SUBMITTED_FOR_REVIEW state.
   */
  static async rejectPost({
    postId,
    reviewerId,
    reviewerRole,
    versionNumber,
    comment,
  }: {
    postId: string;
    reviewerId: string;
    reviewerRole: string;
    versionNumber: number;
    comment: string;
  }) {
    if (!hasSocialPermission(reviewerRole, SOCIAL_PERMISSIONS.APPROVE)) {
      throw new Error('Insufficient permissions to reject content');
    }

    if (!comment || comment.trim().length === 0) {
      throw new Error('Rejection requires a comment or reason');
    }

    const post = await prisma.marketingPost.findUnique({
      where: { id: postId },
      include: {
        versions: {
          where: { version_number: versionNumber }
        }
      }
    });

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.post_status !== 'SUBMITTED_FOR_REVIEW') {
      throw new Error('Post is not in SUBMITTED_FOR_REVIEW state');
    }

    const version = post.versions[0];
    if (!version) {
      throw new Error('Version mismatch: The version requested for rejection does not exist.');
    }

    // Execute rejection inside a transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Create the immutable review record
      const review = await tx.marketingPostReview.create({
        data: {
          post_id: postId,
          post_version_id: version.id,
          version_number: versionNumber,
          reviewer_id: reviewerId,
          decision: 'REJECTED',
          comment,
        }
      });

      // 2. Update post status to REJECTED (or DRAFT, depending on workflow, but usually REJECTED)
      await tx.marketingPost.update({
        where: { id: postId },
        data: {
          post_status: 'REJECTED',
          updated_at: new Date(),
        }
      });

      // 3. Log security event (Audit trail)
      await tx.securityEvent.create({
        data: {
          source_type: 'AUDIT_LOG',
          security_domain: 'APPLICATION_RELIABILITY',
          source_record_id: review.id,
          actor_user_id: reviewerId,
          target_module: 'MarketingPost',
          target_resource_id: postId,
          severity: 'LOW',
          event_category: 'AUTHORIZATION',
          event_classification: 'OBSERVATION',
          environment: 'TEST',
          lifecycle_type: 'TEST',
          occurred_at: new Date(),
          source_received_at: new Date(),
          event_code: 'SEC_SOCIAL_REJECT',
          idempotency_key: `soc_rej_${review.id}_${Date.now()}`,
          source_summary: { versionNumber, reviewId: review.id },
        }
      });

      return review;
    });
  }

  /**
   * Retrieves pending approvals based on the user's scope.
   */
  static async getPendingApprovals() {
    return await prisma.marketingPost.findMany({
      where: {
        post_status: 'SUBMITTED_FOR_REVIEW'
      },
      include: {
        created_by: {
          select: { id: true, full_name: true, email: true }
        },
      },
      orderBy: {
        updated_at: 'asc' // Oldest pending first
      }
    });
  }
}

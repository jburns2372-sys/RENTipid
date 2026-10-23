import { PrismaClient } from '@prisma/client';
import { SOCIAL_PERMISSIONS, hasSocialPermission } from './social-permissions';

const prisma = new PrismaClient();

export class SocialScheduler {
  
  /**
   * Schedules an APPROVED post for future publication.
   */
  static async schedulePost({
    postId,
    userId,
    userRole,
    date,
    timezone = 'UTC',
    targetAccountId
  }: {
    postId: string;
    userId: string;
    userRole?: string;
    date: Date;
    timezone?: string;
    targetAccountId?: string;
  }) {
    if (!hasSocialPermission(userRole, SOCIAL_PERMISSIONS.SCHEDULE)) {
      throw new Error('Insufficient permissions to schedule content');
    }

    if (date < new Date()) {
      throw new Error('Scheduled time must be in the future.');
    }

    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch (e) {
      throw new Error('Invalid timezone specified.');
    }

    const post = await prisma.marketingPost.findUnique({
      where: { id: postId },
      include: {
        versions: {
          orderBy: { version_number: 'desc' },
          take: 1
        },
        reviews: {
          where: { decision: 'APPROVED' },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.post_status !== 'APPROVED') {
      throw new Error('Cannot schedule a post that is not in APPROVED state. Any edits require re-approval.');
    }

    const latestApproval = post.reviews[0];
    if (!latestApproval || latestApproval.version_number !== post.version) {
      throw new Error('Integrity Error: The current post version does not match the approved version.');
    }

    const approvedVersion = post.versions[0];
    
    // Check target account matching
    if (approvedVersion.target_account_id && targetAccountId && approvedVersion.target_account_id !== targetAccountId) {
      throw new Error('Target account mismatch: The requested account was not approved for this version.');
    }
    
    // Account validation
    if (targetAccountId) {
      const account = await prisma.socialAccount.findUnique({ where: { id: targetAccountId } });
      if (!account) throw new Error('Target account not found');
      if (account.health_status === 'DISABLED') throw new Error('Cannot target a DISABLED social account');
    }

    const finalTargetAccountId = approvedVersion.target_account_id || targetAccountId;
    const idempotencyKey = `schedule_${postId}_${post.version}`;

    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Create the Queue Entry bound to the specific version
        const queueEntry = await tx.socialPostQueue.create({
          data: {
            post_id: postId,
            approved_version_id: latestApproval.post_version_id,
            target_account_id: finalTargetAccountId,
            platform: post.platform,
            status: 'Pending',
            scheduled_at: date,
            timezone,
            idempotency_key: idempotencyKey,
            created_by_id: userId,
          }
        });

        // 2. Update Post Status to SCHEDULED
        await tx.marketingPost.update({
          where: { id: postId },
          data: {
            post_status: 'SCHEDULED',
            scheduled_at: date,
            updated_at: new Date()
          }
        });

        // 3. Log security event
        await tx.securityEvent.create({
          data: {
            source_type: 'AUDIT_LOG',
            security_domain: 'APPLICATION_RELIABILITY',
            source_record_id: postId,
            actor_user_id: userId,
            target_module: 'MarketingPost',
            target_resource_id: postId,
            severity: 'LOW',
            event_category: 'AUTHORIZATION',
            event_classification: 'OBSERVATION',
            environment: 'TEST',
            lifecycle_type: 'TEST',
            occurred_at: new Date(),
            source_received_at: new Date(),
            event_code: 'SEC_SOCIAL_SCHEDULE',
            idempotency_key: `soc_sched_${postId}_${Date.now()}`,
            source_summary: JSON.stringify({
              version: post.version,
              scheduled_at: date,
              target_account_id: finalTargetAccountId
            }),
          }
        });

        return queueEntry;
      });
    } catch (e: any) {
       if (e.code === 'P2002' && e.meta?.target?.includes('idempotency_key')) {
          // Idempotency duplicate - return the existing one
          return await prisma.socialPostQueue.findUnique({ where: { idempotency_key: idempotencyKey } });
       }
       throw e;
    }
  }

  static async reschedulePost({
    queueId,
    userId,
    userRole,
    newDate,
    newTimezone
  }: {
    queueId: string;
    userId: string;
    userRole?: string;
    newDate: Date;
    newTimezone?: string;
  }) {
    if (!hasSocialPermission(userRole, SOCIAL_PERMISSIONS.SCHEDULE)) {
      throw new Error('Insufficient permissions to reschedule content');
    }

    if (newDate < new Date()) {
      throw new Error('Scheduled time must be in the future.');
    }
    
    if (newTimezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: newTimezone });
      } catch (e) {
        throw new Error('Invalid timezone specified.');
      }
    }

    return await prisma.$transaction(async (tx) => {
       const queueEntry = await tx.socialPostQueue.findUnique({ where: { id: queueId } });
       if (!queueEntry) throw new Error('Queue entry not found');
       if (queueEntry.status !== 'Pending' && queueEntry.status !== 'Failed') {
          throw new Error('Cannot reschedule an active or completed queue entry');
       }
       
       const post = await tx.marketingPost.findUnique({ where: { id: queueEntry.post_id } });
       if (!post || post.post_status !== 'SCHEDULED') {
          throw new Error('Post is no longer in SCHEDULED state');
       }

       const updatedQueue = await tx.socialPostQueue.update({
         where: { id: queueId },
         data: {
            scheduled_at: newDate,
            timezone: newTimezone || queueEntry.timezone,
            status: 'Pending'
         }
       });

       await tx.marketingPost.update({
         where: { id: queueEntry.post_id },
         data: {
           scheduled_at: newDate,
           updated_at: new Date()
         }
       });
       
       await tx.securityEvent.create({
          data: {
            source_type: 'AUDIT_LOG',
            security_domain: 'APPLICATION_RELIABILITY',
            source_record_id: queueId,
            actor_user_id: userId,
            target_module: 'SocialPostQueue',
            target_resource_id: queueId,
            severity: 'LOW',
            event_category: 'AUTHORIZATION',
            event_classification: 'OBSERVATION',
            environment: 'TEST',
            lifecycle_type: 'TEST',
            occurred_at: new Date(),
            source_received_at: new Date(),
            event_code: 'SEC_SOCIAL_RESCHEDULE',
            idempotency_key: `soc_resched_${queueId}_${Date.now()}`,
            source_summary: JSON.stringify({
              new_date: newDate,
              new_timezone: newTimezone
            }),
          }
       });

       return updatedQueue;
    });
  }

  static async cancelSchedule({
    queueId,
    userId,
    userRole,
    reason
  }: {
    queueId: string;
    userId: string;
    userRole?: string;
    reason?: string;
  }) {
    if (!hasSocialPermission(userRole, SOCIAL_PERMISSIONS.SCHEDULE)) {
      throw new Error('Insufficient permissions to cancel scheduled content');
    }

    return await prisma.$transaction(async (tx) => {
       const queueEntry = await tx.socialPostQueue.findUnique({ where: { id: queueId } });
       if (!queueEntry) throw new Error('Queue entry not found');
       if (queueEntry.status !== 'Pending') {
          throw new Error('Cannot cancel a queue entry that is not Pending');
       }

       const cancelledQueue = await tx.socialPostQueue.update({
         where: { id: queueId },
         data: {
            status: 'Cancelled',
            cancelled_at: new Date(),
            cancellation_reason: reason || 'Manually cancelled'
         }
       });
       
       // Note: we do NOT revert the marketingPost to DRAFT automatically here because 
       // it might just be a cancellation of execution, allowing rescheduling later.
       // The 'SCHEDULED edit' rule reverts to DRAFT, which is handled in updateDraft.

       await tx.securityEvent.create({
          data: {
            source_type: 'AUDIT_LOG',
            security_domain: 'APPLICATION_RELIABILITY',
            source_record_id: queueId,
            actor_user_id: userId,
            target_module: 'SocialPostQueue',
            target_resource_id: queueId,
            severity: 'LOW',
            event_category: 'AUTHORIZATION',
            event_classification: 'OBSERVATION',
            environment: 'TEST',
            lifecycle_type: 'TEST',
            occurred_at: new Date(),
            source_received_at: new Date(),
            event_code: 'SEC_SOCIAL_CANCEL',
            idempotency_key: `soc_cancel_${queueId}_${Date.now()}`,
            source_summary: JSON.stringify({
              reason: reason
            }),
          }
       });

       return cancelledQueue;
    });
  }

  /**
   * Note: Actual external publication is out of scope for Phase 6.
   * This stub ensures that if processQueue is called prematurely,
   * it fails safely. Phase 7 will implement the publication logic.
   */
  static async processQueue() {
    throw new Error('Phase 6 Strict Boundary: Publication engine is not yet implemented. This logic belongs to Phase 7.');
  }
}

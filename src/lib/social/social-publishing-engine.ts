import { PrismaClient } from '@prisma/client';
import { SOCIAL_PLATFORMS, SocialPlatform, SocialAdapter, SocialProviderRegistry } from './social-platform-registry';
import { SOCIAL_PERMISSIONS, hasSocialPermission } from './social-permissions';

const prisma = new PrismaClient();

// In RENTipid, system settings are typically stored in the SystemSetting model
const EMERGENCY_STOP_KEY = 'SOCIAL_EMERGENCY_STOP';
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = [0, 5 * 60 * 1000, 30 * 60 * 1000, 2 * 60 * 60 * 1000]; // 5m, 30m, 2h

export class SocialPublishingEngine {

  /**
   * Main entrypoint for background worker.
   */
  static async processDuePublications() {
    // 1. Check emergency stop
    const emergencyStop = await prisma.systemSetting.findUnique({ where: { setting_key: EMERGENCY_STOP_KEY } });
    if (emergencyStop && emergencyStop.setting_value === 'true') {
      console.warn('SocialPublishingEngine: Emergency stop active. Aborting run.');
      return;
    }

    // 2. Find eligible queues
    // Find queues that are Pending, scheduled <= now
    const dueQueues = await prisma.socialPostQueue.findMany({
      where: {
        status: 'Pending',
        scheduled_at: { lte: new Date() },
        cancelled_at: null
      },
      take: 50,
      orderBy: { scheduled_at: 'asc' }
    });

    for (const q of dueQueues) {
      // 3. Claim the queue item securely (concurrency control)
      const claimed = await prisma.socialPostQueue.updateMany({
        where: {
          id: q.id,
          status: 'Pending'
        },
        data: {
          status: 'Posting'
        }
      });

      if (claimed.count === 0) {
        // Another worker claimed it
        continue;
      }

      // 4. Process the item
      try {
        await this.executePublication(q.id);
      } catch (e: any) {
        console.error(`SocialPublishingEngine: Error processing queue ${q.id}`, e);
        // Ensure queue is marked failed if unhandled exception escapes
        await prisma.socialPostQueue.update({
          where: { id: q.id },
          data: { status: 'Failed', error_message: 'Internal Publishing Engine Error' }
        });
      }
    }
  }

  static async executePublication(queueId: string, isManualRetry: boolean = false, actorUserId?: string) {
    const queue = await prisma.socialPostQueue.findUnique({
      where: { id: queueId },
      include: {
        post: true,
        post_version: true,
        target_account: true,
        publication_attempts: {
          orderBy: { attempt_number: 'desc' }
        }
      }
    });

    if (!queue || !queue.post_version || !queue.target_account) {
      return this.failQueue(queueId, 'Invalid queue integrity: missing version or account', true);
    }

    if (queue.cancelled_at) {
      return this.failQueue(queueId, 'Queue is cancelled', true);
    }

    // Concurrency / Duplicate check
    const existingSuccess = queue.publication_attempts.find(a => a.status === 'SUCCEEDED');
    if (existingSuccess) {
      // Already succeeded. Safe recovery: just update queue status if out of sync
      if (queue.status !== 'Success') {
        await prisma.socialPostQueue.update({
          where: { id: queueId },
          data: { status: 'Success', processed_at: existingSuccess.completed_at || new Date() }
        });
      }
      return;
    }

    const lastAttempt = queue.publication_attempts[0];
    const attemptNumber = lastAttempt ? lastAttempt.attempt_number + 1 : 1;
    
    // Check retry bounds
    if (attemptNumber > MAX_RETRIES && !isManualRetry) {
      return this.failQueue(queueId, 'Max retries exceeded', true);
    }

    // If it's an automated retry, ensure next_retry_at has passed
    if (!isManualRetry && lastAttempt && lastAttempt.is_retryable && lastAttempt.next_retry_at) {
      if (lastAttempt.next_retry_at > new Date()) {
         // Not time yet. Revert to Pending.
         await prisma.socialPostQueue.update({
           where: { id: queueId },
           data: { status: 'Pending' }
         });
         return;
      }
    }

    // Stable Idempotency Key logic
    // The idempotency key identifies this *logical* publication intention across all retries.
    const logicalPublicationKey = queue.idempotency_key || `soc_pub_${queue.id}`;

    // Create Attempt
    const attempt = await prisma.socialPublicationAttempt.create({
      data: {
        queue_id: queue.id,
        post_version_id: queue.post_version.id,
        social_account_id: queue.target_account.id,
        provider: queue.platform,
        attempt_number: attemptNumber,
        publication_key: logicalPublicationKey,
        status: 'PROCESSING',
        started_at: new Date()
      }
    });

    // Resolve Adapter
    let adapter: SocialAdapter;
    try {
      adapter = SocialProviderRegistry.get(queue.platform as SocialPlatform);
    } catch (e) {
      await this.updateAttemptFinal(attempt.id, queueId, 'Unsupported platform adapter');
      return;
    }

    // Check account health
    if (queue.target_account.health_status === 'DISABLED') {
      await this.updateAttemptFinal(attempt.id, queueId, 'Target social account is DISABLED');
      return;
    }

    try {
      // Execute via Provider adapter
      const postData = {
         caption: queue.post_version.content_snapshot,
         media_file_path: queue.post_version.media_snapshot
      };

      const result = await adapter.publishPost(postData, queue.target_account.id, logicalPublicationKey);

      if (result.success) {
        // ------------------
        // SUCCESS PATH
        // ------------------
        await prisma.$transaction(async (tx) => {
          await tx.socialPublicationAttempt.update({
            where: { id: attempt.id },
            data: {
              status: 'SUCCEEDED',
              provider_post_id: result.providerPostId,
              completed_at: new Date()
            }
          });

          await tx.socialPostQueue.update({
             where: { id: queueId },
             data: {
               status: 'Success',
               processed_at: new Date()
             }
          });

          // Mark overall MarketingPost as published if this was the primary target
          await tx.marketingPost.update({
             where: { id: queue.post_id },
             data: {
               post_status: 'PUBLISHED',
               published_at: new Date(),
               updated_at: new Date()
             }
          });

          // Audit
          await tx.auditLog.create({
             data: {
               action: 'SEC_SOCIAL_PUBLISHED',
               actor_user_id: actorUserId && actorUserId !== 'SYSTEM' ? actorUserId : null,
               module: 'SocialPostQueue',
               target_id: queueId,
               details: JSON.stringify({
                 provider_post_id: result.providerPostId,
                 attempt_number: attemptNumber,
                 idempotency_key: `soc_pub_succ_${attempt.id}`
               }),
             }
          });
        });

      } else {
        // ------------------
        // FAILURE PATH
        // ------------------
         if (result.rateLimited || this.isTimeoutError(result.error)) {
            if (attemptNumber >= MAX_RETRIES) {
               await this.updateAttemptFinal(attempt.id, queueId, result.error || 'Max retries exceeded');
            } else {
               // RETRYABLE
               const nextRetry = new Date(Date.now() + (RETRY_BACKOFF_MS[attemptNumber] || RETRY_BACKOFF_MS[RETRY_BACKOFF_MS.length - 1]));
               await prisma.$transaction(async (tx) => {
              await tx.socialPublicationAttempt.update({
                where: { id: attempt.id },
                data: {
                  status: 'FAILED_RETRYABLE',
                  normalized_error: result.error,
                  is_retryable: true,
                  next_retry_at: nextRetry,
                  completed_at: new Date()
                }
              });

              // Revert queue to Pending for the next cycle
              await tx.socialPostQueue.update({
                 where: { id: queueId },
                 data: { status: 'Pending' }
              });
               });
            }
         } else {
           // TERMINAL
           await this.updateAttemptFinal(attempt.id, queueId, result.error || 'Unknown terminal failure');
        }
      }
    } catch (e: any) {
      // Timeout ambiguity or crash during HTTP call
      console.error(`SocialPublishingEngine: Crash during provider call for attempt ${attempt.id}`, e);
      
      const isTimeout = e.message?.toLowerCase().includes('timeout');
      if (isTimeout) {
         if (attemptNumber >= MAX_RETRIES) {
            await this.updateAttemptFinal(attempt.id, queueId, 'Connection Timeout. Max retries exceeded.');
         } else {
            const nextRetry = new Date(Date.now() + RETRY_BACKOFF_MS[1]); // Short backoff
         await prisma.$transaction(async (tx) => {
            await tx.socialPublicationAttempt.update({
              where: { id: attempt.id },
              data: {
                status: 'FAILED_RETRYABLE',
                normalized_error: 'Connection Timeout. Provider may have accepted post.',
                is_retryable: true,
                next_retry_at: nextRetry,
                completed_at: new Date()
              }
            });
            await tx.socialPostQueue.update({
               where: { id: queueId },
               data: { status: 'Pending' }
            });
         });
         }
      } else {
         await this.updateAttemptFinal(attempt.id, queueId, e.message || 'Crash during execution');
      }
    }
  }

  private static isTimeoutError(errorMsg?: string): boolean {
    if (!errorMsg) return false;
    const lower = errorMsg.toLowerCase();
    return lower.includes('timeout') || lower.includes('socket hang up') || lower.includes('econnreset');
  }

  private static async updateAttemptFinal(attemptId: string, queueId: string, error: string) {
    await prisma.$transaction(async (tx) => {
      await tx.socialPublicationAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'FAILED_FINAL',
          normalized_error: error,
          is_retryable: false,
          completed_at: new Date()
        }
      });
      await tx.socialPostQueue.update({
        where: { id: queueId },
        data: { status: 'Failed', error_message: error }
      });
    });
  }

  private static async failQueue(queueId: string, error: string, terminal: boolean) {
    await prisma.socialPostQueue.update({
      where: { id: queueId },
      data: { status: 'Failed', error_message: error }
    });
  }

  /**
   * Manual Retry Hook
   */
  static async triggerManualRetry(queueId: string, userId: string, userRole?: string) {
    if (!hasSocialPermission(userRole, SOCIAL_PERMISSIONS.SCHEDULE)) {
      throw new Error('Insufficient permissions to trigger manual retry');
    }

    const emergencyStop = await prisma.systemSetting.findUnique({ where: { setting_key: EMERGENCY_STOP_KEY } });
    if (emergencyStop && emergencyStop.setting_value === 'true') {
      throw new Error('Social emergency stop is active. Cannot manually retry.');
    }

    const queue = await prisma.socialPostQueue.findUnique({
      where: { id: queueId },
      include: { publication_attempts: true }
    });

    if (!queue) throw new Error('Queue not found');
    
    const hasSuccess = queue.publication_attempts.some(a => a.status === 'SUCCEEDED');
    if (hasSuccess) {
      throw new Error('Cannot retry a publication that has already succeeded.');
    }

    // Optimistically grab the queue for processing, bypassing scheduled_at and standard locks
    const claimed = await prisma.socialPostQueue.updateMany({
      where: { id: queueId },
      data: { status: 'Posting' }
    });

    if (claimed.count === 0) {
      throw new Error('Queue is currently locked or processing.');
    }

    // Execute immediately in foreground
    await this.executePublication(queueId, true, userId);

    return await prisma.socialPostQueue.findUnique({ where: { id: queueId } });
  }
}

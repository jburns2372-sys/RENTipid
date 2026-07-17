"use server";

import { AlertReviewService } from "@/lib/security/rules/alert-review.service";
import { SecurityAlertReviewStatus } from "@prisma/client";
import { z } from "zod";

const updateStatusSchema = z.object({
  alertId: z.string().min(1),
  newStatus: z.nativeEnum(SecurityAlertReviewStatus),
  reviewNotes: z.string().max(1000),
  expectedReviewVersion: z.number().int().min(0)
});

export async function updateAlertStatusAction(userId: string, data: {
  alertId: string;
  newStatus: string;
  reviewNotes: string;
  expectedReviewVersion: number;
}) {
  try {
    const parsed = updateStatusSchema.parse(data);
    await AlertReviewService.updateAlertReviewStatus(
      userId,
      parsed.alertId,
      parsed.newStatus,
      parsed.reviewNotes,
      parsed.expectedReviewVersion
    );
    return { success: true };
  } catch (error: any) {
    // Return privacy-safe errors
    return { success: false, error: error.message || "Failed to update review status" };
  }
}

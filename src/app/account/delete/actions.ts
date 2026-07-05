'use server';

import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export async function submitAccountDeletion(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const userId = (session.user as any).id;
  const reason = formData.get('reason') as string;

  if (!reason) {
    throw new Error("Reason is required");
  }

  // Check active transactions
  const activeBookings = await prisma.booking.count({
    where: {
      OR: [ { renter_id: userId }, { provider_id: userId } ],
      status: { notIn: ['Completed', 'Cancelled by Renter', 'Cancelled by Provider', 'Rejected', 'Expired'] }
    }
  });

  const status = activeBookings > 0 ? "Blocked Due to Active Transaction" : "Requested";

  await prisma.accountDeletionRequest.create({
    data: {
      user_id: userId,
      reason,
      status
    }
  });

  redirect('/account/delete');
}

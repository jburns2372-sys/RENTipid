import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function SOPRefundReview() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Finance Admin' && role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard/admin/sop" className="text-blue-600 hover:underline flex items-center gap-2">
        <ArrowLeft size={16} /> Back to SOPs
      </Link>
      
      <h1 className="text-3xl font-bold">SOP: Manual Refund Review & Processing</h1>
      
      <div className="bg-white p-6 border rounded-xl shadow-sm space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2 text-blue-800">1. Eligibility Check</h2>
          <p className="text-gray-700">Refunds are only eligible if the booking status is `Cancelled by Provider`, `Cancelled by Renter` (prior to start), or `Rejected`. Ensure that the amount requested does not exceed the total paid.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2 text-blue-800">2. Threshold Review</h2>
          <p className="text-gray-700">Any refund request exceeding the `FINANCE_REFUND_APPROVAL_THRESHOLD` requires escalation to Super Admin. Do not process refunds over this amount without explicit written approval logged in the notes.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2 text-blue-800">3. Manual Bank Transfer</h2>
          <ul className="list-disc pl-5 text-gray-700 space-y-2">
            <li>Log into the corporate banking portal.</li>
            <li>Initiate a transfer to the Renter's provided bank details.</li>
            <li>Use the Refund Number (e.g., `RFD-123456`) as the transfer reference.</li>
            <li>Wait for the bank to confirm the transfer was successful.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2 text-blue-800">4. Finalizing in Platform</h2>
          <p className="text-gray-700">Once the transfer is successful, upload the bank receipt via the secure attachment endpoint, set the status to `Processed Manual Placeholder`, and paste the exact Bank Reference ID into the record.</p>
        </section>
      </div>
    </div>
  );
}

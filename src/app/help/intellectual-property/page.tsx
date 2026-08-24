import React from 'react';
import { Copyright, AlertTriangle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Intellectual Property Policy | RENTipid',
  description: 'RENTipid Intellectual Property Rights, Copyright, and Trademark policies.',
};

export default function IntellectualPropertyPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <Copyright className="text-blue-600" size={36} />
          Intellectual Property Policy
        </h1>
        <p className="text-lg text-gray-600">
          RENTipid respects the intellectual property rights of others and expects our users to do the same.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm mb-8 prose max-w-none text-gray-700">
        <h2 className="text-2xl font-semibold text-gray-900 mt-0 mb-4">1. Copyright and Trademark Infringement</h2>
        <p>
          You may not post, distribute, or reproduce in any way any copyrighted material, trademarks, or other proprietary information without obtaining the prior written consent of the owner of such proprietary rights. It is our policy to terminate the privileges of any user who repeatedly infringes the copyright rights of others upon receipt of prompt notification to RENTipid by the copyright owner or the copyright owner&apos;s legal agent.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Reporting IP Violations</h2>
        <p>
          If you believe that your work has been copied and posted on the RENTipid platform in a way that constitutes copyright infringement, please provide us with the following information:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>An electronic or physical signature of the person authorized to act on behalf of the owner of the copyright interest.</li>
          <li>A description of the copyrighted work that you claim has been infringed.</li>
          <li>A description of where the material that you claim is infringing is located on the platform.</li>
          <li>Your address, telephone number, and email address.</li>
          <li>A written statement by you that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Counter-Notices</h2>
        <p>
          If you believe that your content that was removed (or to which access was disabled) is not infringing, or that you have the authorization from the copyright owner, the copyright owner&apos;s agent, or pursuant to the law, to post and use the material in your content, you may send a counter-notice containing the necessary information to our Copyright Agent.
        </p>

        <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-100 flex gap-4">
          <div className="flex-shrink-0 mt-1">
            <ShieldCheck className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 m-0">Contact Our Legal Team</h3>
            <p className="text-blue-800 text-sm mt-1 mb-0">
              For any intellectual property related concerns, please direct your notices to our designated agent at <a href="mailto:legal@rentipid.com" className="font-medium underline hover:text-blue-600">legal@rentipid.com</a>.
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center bg-gray-50 p-6 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <AlertTriangle size={20} className="text-orange-500" />
          Report an infringement now
        </div>
        <Link href="/help/complaints-appeals" className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          Submit IP Report
        </Link>
      </div>
    </div>
  );
}

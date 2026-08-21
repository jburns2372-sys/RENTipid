import React from 'react';
import Link from 'next/link';
import { Shield, FileText, Globe, AlertTriangle, Scale, Settings } from 'lucide-react';

export default function TrustSafetyLegalPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-blue-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">Trust, Safety & Legal</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Everything you need to know about our compliance, safety policies, and legal agreements.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/help/trust-safety-legal/global-legal-compliance" className="block group">
          <div className="bg-white border border-gray-200 rounded-xl p-6 h-full shadow-sm group-hover:shadow-md group-hover:border-blue-300 transition-all">
            <Globe className="text-blue-500 mb-4" size={28} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-700">Global Legal Compliance</h2>
            <p className="text-gray-600">
              Your Market Compliance, Philippine Baseline, and International Jurisdiction Directory.
            </p>
          </div>
        </Link>

        <Link href="/help/privacy" className="block group">
          <div className="bg-white border border-gray-200 rounded-xl p-6 h-full shadow-sm group-hover:shadow-md group-hover:border-blue-300 transition-all">
            <FileText className="text-purple-500 mb-4" size={28} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-700">Privacy & Data Protection</h2>
            <p className="text-gray-600">
              Privacy notices, rights, cookies, data transfers, retention and data-subject requests.
            </p>
          </div>
        </Link>

        <Link href="/prohibited-items" className="block group">
          <div className="bg-white border border-gray-200 rounded-xl p-6 h-full shadow-sm group-hover:shadow-md group-hover:border-blue-300 transition-all">
            <Shield className="text-red-500 mb-4" size={28} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-700">Prohibited & Restricted Items</h2>
            <p className="text-gray-600">
              Catalogue of prohibited, restricted, and unsupported items and services on RENTipid.
            </p>
          </div>
        </Link>

        <Link href="/help/complaints-appeals" className="block group">
          <div className="bg-white border border-gray-200 rounded-xl p-6 h-full shadow-sm group-hover:shadow-md group-hover:border-blue-300 transition-all">
            <Scale className="text-red-500 mb-4" size={28} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-700">Complaints, Reports & Appeals</h2>
            <p className="text-gray-600">
              Consumer complaints, illegal/prohibited listing reports, moderation reasons, and appeals.
            </p>
          </div>
        </Link>

        <Link href="/help/ads-recommendations-transparency" className="block group">
          <div className="bg-white border border-gray-200 rounded-xl p-6 h-full shadow-sm group-hover:shadow-md group-hover:border-blue-300 transition-all">
            <Settings className="text-orange-500 mb-4" size={28} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-700">Advertising & Recommendation Transparency</h2>
            <p className="text-gray-600">
              Sponsored/promoted labels, ranking/recommendation disclosures, and AI transparency.
            </p>
          </div>
        </Link>

        <Link href="/help/intellectual-property" className="block group">
          <div className="bg-white border border-gray-200 rounded-xl p-6 h-full shadow-sm group-hover:shadow-md group-hover:border-blue-300 transition-all">
            <svg className="text-indigo-500 mb-4 w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M14.83 14.83a4 4 0 1 1 0-5.66"></path></svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-700">Intellectual Property</h2>
            <p className="text-gray-600">
              Copyright rules, trademark policies, and how to report IP infringement.
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-12 bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="text-yellow-600" size={20} />
          Can't find what you're looking for?
        </h3>
        <p className="text-gray-600 mb-4">
          Our RENTipid Support Assistant can help guide you to the right policy or escalate to a specialist.
        </p>
        <Link href="/help" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Ask RENTipid Assistant
        </Link>
      </div>
    </div>
  );
}

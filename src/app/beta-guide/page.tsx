import React from 'react';
import { Sparkles, ShieldCheck, Wrench, Coins } from 'lucide-react';
import Link from 'next/link';

export default function BetaGuidePage() {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12">
      <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl mb-8">
        <h1 className="text-3xl font-bold text-purple-900 flex items-center gap-2">
          <Sparkles className="text-purple-600" /> Welcome to the RENTipid Beta!
        </h1>
        <p className="text-purple-800 mt-2">
          You have been exclusively invited to help us test the most advanced AI-powered rental marketplace. 
          Please read this guide to understand how the beta works.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <ShieldCheck size={32} className="text-green-600 mb-4" />
          <h2 className="text-xl font-bold mb-2">Safe Testing Environment</h2>
          <p className="text-gray-600">
            <strong>Real Payments are OFF.</strong> We use a Mock Gateway. Do not use real credit card numbers. 
            <strong> Social Posting is OFF.</strong> Marketing tools will only generate mock campaigns that do not post to real social media.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <Wrench size={32} className="text-amber-600 mb-4" />
          <h2 className="text-xl font-bold mb-2">Your Mission</h2>
          <p className="text-gray-600">
            Try to break things! Submit listings, book items, file damage claims, and talk to the AI. When you find a bug or have a suggestion, use the <Link href="/feedback" className="text-blue-600 hover:underline">Feedback Tool</Link>.
          </p>
        </div>
      </div>

      <div className="prose max-w-none text-gray-700">
        <h3>How to get started:</h3>
        <ol>
          <li><strong>Register:</strong> Use your beta invitation code.</li>
          <li><strong>Verify:</strong> Submit mock KYC documents (you can use test images).</li>
          <li><strong>List or Book:</strong> Try listing an item in the enabled categories (Tools, Event Equipment) or booking an existing one.</li>
        </ol>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-500">
          Need technical help? Visit the <Link href="/support" className="text-blue-600 hover:underline">Support Desk</Link>.
        </div>
      </div>
    </div>
  );
}

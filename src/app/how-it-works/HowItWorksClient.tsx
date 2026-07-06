'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, CalendarCheck, ShieldCheck, Truck, PlusCircle, CheckCircle, Wallet, ArrowRight, UserCheck, Lock, HeadphonesIcon } from 'lucide-react';

export default function HowItWorksClient() {
  const [activeTab, setActiveTab] = useState<'renter' | 'provider'>('renter');

  const renterSteps = [
    {
      icon: <Search className="w-8 h-8 text-blue-600" />,
      title: "1. Discover & Browse",
      description: "Search for the exact equipment you need. Filter by category, location, and dates. Compare prices and read provider reviews."
    },
    {
      icon: <CalendarCheck className="w-8 h-8 text-blue-600" />,
      title: "2. Request to Book",
      description: "Select your dates and submit a booking request. You'll need to complete a quick ID verification to ensure a safe community."
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-blue-600" />,
      title: "3. Pay Securely",
      description: "Once approved, pay via GCash, Maya, or Card. Your funds are held securely in escrow until the rental is successfully completed."
    },
    {
      icon: <Truck className="w-8 h-8 text-blue-600" />,
      title: "4. Pickup & Return",
      description: "Coordinate with the provider for pickup or delivery. Use the equipment, return it in good condition, and leave a review!"
    }
  ];

  const providerSteps = [
    {
      icon: <PlusCircle className="w-8 h-8 text-emerald-600" />,
      title: "1. List Your Equipment",
      description: "Create a free listing with photos, descriptions, and rules. Complete your business or individual verification to start accepting bookings."
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-emerald-600" />,
      title: "2. Approve Requests",
      description: "Receive booking requests from verified renters. Review their profile and approve the ones you are comfortable with."
    },
    {
      icon: <ArrowRight className="w-8 h-8 text-emerald-600" />,
      title: "3. Handover",
      description: "Meet the renter or deliver the item. Complete a digital inspection form during handover to document the equipment's condition."
    },
    {
      icon: <Wallet className="w-8 h-8 text-emerald-600" />,
      title: "4. Get Paid Securely",
      description: "After the equipment is returned safely, your payout is automatically released from escrow directly to your bank or e-wallet."
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="bg-white border-b pt-20 pb-16">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            How <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">RENTipid</span> Works
          </h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            The safest and smartest way to rent equipment. Whether you need tools for a day or want to earn money from your idle assets, we've got you covered.
          </p>

          {/* Toggle Switch */}
          <div className="inline-flex bg-gray-100 p-1.5 rounded-full shadow-inner mb-8">
            <button
              onClick={() => setActiveTab('renter')}
              className={`px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                activeTab === 'renter'
                  ? 'bg-white text-blue-700 shadow-md transform scale-105'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              For Renters
            </button>
            <button
              onClick={() => setActiveTab('provider')}
              className={`px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                activeTab === 'provider'
                  ? 'bg-white text-emerald-700 shadow-md transform scale-105'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              For Providers
            </button>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 relative">
            {(activeTab === 'renter' ? renterSteps : providerSteps).map((step, idx) => (
              <div 
                key={idx} 
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${
                  activeTab === 'renter' ? 'bg-blue-50 group-hover:bg-blue-100' : 'bg-emerald-50 group-hover:bg-emerald-100'
                }`}>
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety Section */}
      <section className="bg-slate-900 text-white py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built on Trust & Safety</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">We take security seriously. Every transaction is protected by our comprehensive safety framework.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <UserCheck className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Verified Community</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Every user undergoes thorough identity verification (KYC) before they can transact on the platform.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure Escrow</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Payments are held securely in escrow and only released when the rental is successfully completed.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <HeadphonesIcon className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">24/7 Support</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Our dedicated resolution center and support team are always ready to help mediate any disputes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white text-center">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-4xl font-bold mb-8">Ready to get started?</h2>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link 
              href="/browse" 
              className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg hover:shadow-blue-600/30 w-full sm:w-auto"
            >
              Browse Rentals
            </Link>
            <Link 
              href="/dashboard/provider/listings/new" 
              className="px-8 py-4 bg-white border-2 border-emerald-600 text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition shadow-lg w-full sm:w-auto"
            >
              List Equipment
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

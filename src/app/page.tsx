import React from 'react';
import Link from 'next/link';
import { Search, ShieldCheck, Zap, ArrowRight, Bot } from 'lucide-react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';

import RentipidLogo from '@/components/brand/RentipidLogo';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white pt-12 pb-16">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <RentipidLogo variant="full" size="xl" showText={false} className="mb-8" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
            Why buy it? <span className="text-blue-600">RENTipid.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            A verified rental marketplace for safely renting tools, equipment, spaces, properties, and other legally rentable assets.
          </p>

          {/* Search Bar */}
          <form action="/browse" method="GET" className="bg-white p-2 rounded-full shadow-lg border max-w-2xl mx-auto flex items-center mb-10">
            <div className="flex-1 px-4 text-left">
              <label htmlFor="category" className="block text-xs font-semibold text-gray-800 cursor-pointer">What are you looking for?</label>
              <input
                type="text"
                id="category"
                name="category"
                placeholder="Tools, vehicles, venues..."
                className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
              />
            </div>
            <div className="hidden sm:block border-l px-4 text-left flex-1">
              <label htmlFor="location" className="block text-xs font-semibold text-gray-800 cursor-pointer">Where?</label>
              <input
                type="text"
                id="location"
                name="location"
                placeholder="City or neighborhood"
                className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent"
              />
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 h-12 w-12 flex items-center justify-center flex-shrink-0 transition-colors">
              <Search size={20} />
            </button>
          </form>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse" className="bg-gray-900 text-white hover:bg-gray-800 px-8 py-3 rounded-full font-medium transition-colors">
              Start Renting
            </Link>
            <Link href="/register/business" className="bg-white border-2 border-gray-200 text-gray-800 hover:border-gray-300 px-8 py-3 rounded-full font-medium transition-colors">
              List Your Item
            </Link>
          </div>
        </div>
      </section>

      {/* Category Preview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {[
              { name: 'Tools', icon: '🔨' },
              { name: 'Vehicles', icon: '🚗' },
              { name: 'Event Eqpt', icon: '🎪' },
              { name: 'Cameras', icon: '📷' },
              { name: 'Venues', icon: '🏢' },
              { name: 'Heavy Eqpt', icon: '🚜' }
            ].map((cat, i) => (
              <Link href="/browse" key={i} className="flex flex-col items-center justify-center p-6 border rounded-xl hover:shadow-md hover:border-blue-200 transition-all cursor-pointer bg-slate-50 hover:bg-white">
                <span className="text-3xl mb-3">{cat.icon}</span>
                <span className="font-medium text-sm text-gray-800">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-20 bg-slate-50 border-t border-b">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Rent with Complete Peace of Mind</h2>
            <p className="text-gray-600">Every transaction is secured, verified, and protected.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Verified Users</h3>
              <p className="text-gray-600 leading-relaxed">
                We verify identities and business permits before they can list or rent high-value items, keeping scams out of the platform.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Deposit Protection</h3>
              <p className="text-gray-600 leading-relaxed">
                Security deposits are held safely in the platform and automatically resolved based on before-and-after photo inspections.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Bot size={100} />
              </div>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 relative z-10">
                <Bot size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 relative z-10">AI Assistance</h3>
              <p className="text-gray-600 leading-relaxed relative z-10">
                Our AI Concierge helps you find the right items, suggests fair pricing, and guides you through rental agreements and disputes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Split Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">For Renters</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1"><ShieldCheck size={20} /></span>
                  <div>
                    <h4 className="font-semibold">Save money and space</h4>
                    <p className="text-gray-600 text-sm">Don't buy a drill for one hole. Rent it for a day.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1"><ShieldCheck size={20} /></span>
                  <div>
                    <h4 className="font-semibold">Standardized Agreements</h4>
                    <p className="text-gray-600 text-sm">Every booking automatically generates a clear, fair contract.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1"><ShieldCheck size={20} /></span>
                  <div>
                    <h4 className="font-semibold">Fair Dispute Resolution</h4>
                    <p className="text-gray-600 text-sm">Our admin team and AI helpers ensure objective damage reviews.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 p-8 rounded-3xl">
              <h2 className="text-3xl font-bold mb-6">For Providers</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1"><ArrowRight size={20} /></span>
                  <div>
                    <h4 className="font-semibold">Turn idle assets into income</h4>
                    <p className="text-gray-600 text-sm">List your unused gear, properties, and vehicles safely.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1"><ArrowRight size={20} /></span>
                  <div>
                    <h4 className="font-semibold">Verified Renters Only</h4>
                    <p className="text-gray-600 text-sm">You control who can rent your items. Require IDs and deposits.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1"><ArrowRight size={20} /></span>
                  <div>
                    <h4 className="font-semibold">AI Social Promotion</h4>
                    <p className="text-gray-600 text-sm">Let our AI generate marketing campaigns to promote your listings worldwide.</p>
                  </div>
                </li>
              </ul>
              <div className="mt-8">
                <Link href="/register/business" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors text-sm">
                  Become a Verified Provider
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-blue-600 text-white py-16 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to join RENTipid?</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">Create an account today and start renting securely.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-full font-bold transition-colors">
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* Global AI Assistant Placeholder */}
      <AIAssistantButton context="Homepage" />
    </>
  );
}

import React from 'react';
import Link from 'next/link';
import RentipidLogo from '@/components/brand/RentipidLogo';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t py-12 px-4">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <RentipidLogo variant="full" size="sm" showText={true} className="items-start mb-4" />
          <p className="text-gray-500 text-sm mt-4">
            RENTipid is a verified rental marketplace for safely renting tools, equipment, spaces, properties, and other legally rentable assets.
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold mb-4 text-gray-800">Platform</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/browse" className="hover:text-blue-600">Browse Rentals</Link></li>
            <li><Link href="/how-it-works" className="hover:text-blue-600">How It Works</Link></li>
            <li><Link href="/register/business" className="hover:text-blue-600">List Your Item</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold mb-4 text-gray-800">Trust & Safety</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/safety" className="hover:text-blue-600">Safety Center</Link></li>
            <li><Link href="/prohibited-items" className="hover:text-blue-600">Prohibited Items</Link></li>
            <li><Link href="/terms" className="hover:text-blue-600">Terms & Conditions</Link></li>
            <li><Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold mb-4 text-gray-800">Support</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/help" className="hover:text-blue-600">Help Center</Link></li>
            <li><Link href="/contact" className="hover:text-blue-600">Contact Us</Link></li>
            <li><span className="text-gray-400">Social Media (Phase 10)</span></li>
          </ul>
        </div>
      </div>
      
      <div className="container mx-auto mt-12 pt-8 border-t text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} RENTipid. All rights reserved.</p>
      </div>
    </footer>
  );
}

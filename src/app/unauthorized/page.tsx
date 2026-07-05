import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="container mx-auto py-20 px-4 flex justify-center items-center flex-col min-h-[60vh]">
      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert size={40} />
      </div>
      <h1 className="text-3xl font-bold mb-4 text-gray-900">Access Denied</h1>
      <p className="text-gray-600 mb-8 max-w-md text-center">
        You do not have permission to access this page. Please ensure you are logged into the correct account or contact support if you believe this is an error.
      </p>
      <Link href="/" className="bg-blue-600 text-white font-medium py-3 px-8 rounded-full hover:bg-blue-700 transition">
        Return to Home
      </Link>
    </div>
  );
}

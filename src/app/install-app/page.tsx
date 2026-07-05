import React from 'react';
import Link from 'next/link';

export default function InstallAppPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Install RENTipid App</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded mb-8 text-sm">
        <strong>V1 Launch Note:</strong> RENTipid mobile app mode may use sandbox payment and mock social posting depending on current launch settings. Real financial transactions are disabled until production clearance.
      </div>

      <div className="space-y-8">
        <section className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-xl font-bold mb-4">Install on iOS (iPhone/iPad)</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Open this page in <strong>Safari</strong>.</li>
            <li>Tap the <strong>Share</strong> button (square with an arrow pointing up) at the bottom of the screen.</li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
            <li>Tap <strong>Add</strong> in the top right corner.</li>
          </ol>
        </section>

        <section className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-xl font-bold mb-4">Install on Android</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Open this page in <strong>Chrome</strong>.</li>
            <li>Tap the <strong>Menu</strong> icon (three dots) in the top right corner.</li>
            <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
            <li>Follow the on-screen prompt to confirm.</li>
          </ol>
        </section>

        <section className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-xl font-bold mb-4">What is the RENTipid App?</h2>
          <p className="text-gray-700 leading-relaxed">
            RENTipid is built as a Progressive Web App (PWA). This means you can install it directly from your browser without needing an app store. It takes up significantly less space on your device, updates automatically, and provides a full app-like experience securely.
          </p>
        </section>

        <div className="text-center mt-8">
          <Link href="/" className="text-blue-600 hover:underline font-medium">
            &larr; Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from 'react';
import Link from 'next/link';
import { signOut, useSession } from "next-auth/react";
import RentipidLogo from '@/components/brand/RentipidLogo';

export default function Header() {
  const { data: session, status } = useSession();

  const getDashboardLink = () => {
    if (!session?.user) return "/login";
    const role = (session.user as any).role;
    switch(role) {
      case 'Renter': return "/dashboard/renter";
      case 'Individual Provider': return "/dashboard/provider";
      case 'Business Provider': return "/dashboard/business";
      case 'Admin': return "/dashboard/admin";
      case 'Compliance Admin': return "/dashboard/compliance";
      case 'Finance Admin': return "/dashboard/finance";
      case 'Super Admin': return "/dashboard/super-admin";
      default: return "/login";
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <RentipidLogo variant="full" size="md" />
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/browse" className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600">
              Browse Rentals
            </Link>
            <Link href="/how-it-works" className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600">
              How It Works
            </Link>
            <Link href="/safety" className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600">
              Safety
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {status === "loading" ? (
              <span className="text-sm text-gray-400">Loading...</span>
            ) : session?.user ? (
              <>
                <span className="text-sm font-medium text-gray-800 mr-2">
                  Hi, {session.user.name}
                </span>
                <Link href={getDashboardLink()} className="text-sm font-medium text-gray-600 hover:text-blue-600 px-3 py-2">
                  Dashboard
                </Link>
                <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-2">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/register/business" className="hidden md:inline-flex text-sm font-medium text-gray-600 hover:text-blue-600 px-3 py-2">
                  List Your Item
                </Link>
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 px-3 py-2">
                  Login
                </Link>
                <Link href="/register" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

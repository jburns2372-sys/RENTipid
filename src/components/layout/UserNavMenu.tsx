'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { signOutWithStepUpCleanup } from '@/lib/auth/sign-out';

interface UserNavMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  dashboardLink: string;
}

export default function UserNavMenu({ user, dashboardLink }: UserNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden border border-blue-200">
          {user.image ? (
            <img src={user.image} alt={user.name || 'User'} className="h-full w-full object-cover" />
          ) : (
            user.name ? user.name.charAt(0).toUpperCase() : 'U'
          )}
        </div>
        <span className="text-sm font-medium text-gray-800 hidden md:block">
          {user.name || 'User'}
        </span>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          
          <Link href="/dashboard/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsOpen(false)}>
            My Profile
          </Link>
          <Link href={dashboardLink} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsOpen(false)}>
            Dashboard
          </Link>
          <Link href="/dashboard/profile?tab=security" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsOpen(false)}>
            Security
          </Link>
          <Link href="/account/sessions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsOpen(false)}>
            Active Sessions
          </Link>
          
          <div className="border-t border-gray-100 mt-1"></div>
          <button 
            onClick={() => { setIsOpen(false); void signOutWithStepUpCleanup('/'); }}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

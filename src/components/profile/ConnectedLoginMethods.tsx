'use client';

import React, { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, AlertCircle, CheckCircle2, Link2, ExternalLink } from 'lucide-react';

interface LoginMethod {
  id: string;
  name: string;
  connected: boolean;
  available: boolean;
  email?: string | null;
  phone?: string | null;
  identityId?: string | null;
}

export default function ConnectedLoginMethods() {
  const searchParams = useSearchParams();
  const [methods, setMethods] = useState<LoginMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'IdentityInUse') {
      setMessage({
        type: 'error',
        text: 'This login method is already connected to another RENTipid account.',
      });
    } else if (searchParams.get('linked')) {
      setMessage({
        type: 'success',
        text: 'Your login method was successfully connected!',
      });
    }
  }, [searchParams]);

  const loadMethods = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/account/connected-methods');
      if (res.ok) {
        const data = await res.json();
        setMethods(data.methods || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const handleConnect = async (providerId: string) => {
    try {
      setActionLoading(providerId);
      setMessage(null);

      const res = await fetch('/api/auth/oauth/link-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to initiate link');
      }

      const callbackUrl = `${window.location.pathname}?linked=${providerId}`;
      await signIn(providerId, { callbackUrl });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to connect method',
      });
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (providerId: string) => {
    if (!confirm(`Are you sure you want to disconnect ${providerId}?`)) return;

    try {
      setActionLoading(providerId);
      setMessage(null);

      const res = await fetch('/api/account/connected-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || data?.error || 'Failed to disconnect');
      }

      setMessage({
        type: 'success',
        text: 'Method disconnected successfully.',
      });
      await loadMethods();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to disconnect',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getProviderIcon = (id: string) => {
    switch (id) {
      case 'apple':
        return (
          <svg className="w-5 h-5 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.93-.91.04-2.02.6-2.67 1.37-.58.67-1.1 1.77-.96 2.82 1.02.08 2.06-.5 2.69-1.26z" />
          </svg>
        );
      case 'google':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        );
      case 'facebook':
        return (
          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        );
      default:
        return <Link2 className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <div className="flex items-center justify-between mb-4 border-b pb-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Connected Login Methods
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Connect your sign-in methods to easily access your RENTipid account with any provider.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg mb-4 text-sm flex items-center gap-2 ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {message.type === 'error' ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-6 text-center text-sm text-gray-400">Loading sign-in methods...</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {methods.map((method) => {
            const isOauth = ['apple', 'google', 'facebook'].includes(method.id);

            return (
              <div key={method.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                    {getProviderIcon(method.id)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{method.name}</span>
                      {method.connected ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Connected
                        </span>
                      ) : !method.available ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                          Unavailable in Preview
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                          Not connected
                        </span>
                      )}
                    </div>
                    {(method.email || method.phone) && (
                      <p className="text-xs text-gray-500 mt-0.5">{method.email || method.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  {method.connected && isOauth && (
                    <button
                      type="button"
                      onClick={() => handleDisconnect(method.id)}
                      disabled={actionLoading === method.id}
                      className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === method.id ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  )}

                  {!method.connected && method.available && isOauth && (
                    <button
                      type="button"
                      onClick={() => handleConnect(method.id)}
                      disabled={actionLoading === method.id}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {actionLoading === method.id ? 'Connecting...' : `Connect ${method.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

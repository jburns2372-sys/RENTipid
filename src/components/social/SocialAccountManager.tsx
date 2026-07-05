'use client';

import React, { useState } from 'react';
import { SOCIAL_PLATFORMS } from '@/lib/social/social-platform-registry';
import { Share2, CheckCircle2, AlertTriangle, Link as LinkIcon, Unlink } from 'lucide-react';

interface SocialAccountManagerProps {
  isAdmin: boolean;
}

export default function SocialAccountManager({ isAdmin }: SocialAccountManagerProps) {
  // In Phase 8, this uses local state mock for demonstration. 
  // In production, this would fetch from /api/social/accounts
  const [connections, setConnections] = useState<Record<string, string>>({
    [SOCIAL_PLATFORMS.FACEBOOK]: 'Not Connected',
    [SOCIAL_PLATFORMS.INSTAGRAM]: 'Not Connected',
    [SOCIAL_PLATFORMS.TIKTOK]: 'Not Connected',
    [SOCIAL_PLATFORMS.YOUTUBE]: 'Not Connected',
    [SOCIAL_PLATFORMS.LINKEDIN]: 'Not Connected',
    [SOCIAL_PLATFORMS.X]: 'Not Connected',
    [SOCIAL_PLATFORMS.PINTEREST]: 'Not Connected',
    [SOCIAL_PLATFORMS.WHATSAPP]: 'Not Connected',
  });

  const handleConnect = (platform: string) => {
    // Simulate OAuth redirect and success
    setConnections(prev => ({ ...prev, [platform]: 'Connected Placeholder' }));
  };

  const handleDisconnect = (platform: string) => {
    setConnections(prev => ({ ...prev, [platform]: 'Not Connected' }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Share2 size={24} className="text-blue-600" /> 
            {isAdmin ? 'Official Platform Social Accounts' : 'Your Social Accounts'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Connect social media profiles to enable direct publishing and campaign management.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 p-4 rounded-lg mb-6 text-sm text-amber-800 flex items-start gap-3">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <p>
          <strong>Notice:</strong> We are currently in Phase 8 Sandbox mode. Connecting an account will establish a "Mock Connection" allowing you to simulate the campaign workflow without making real API calls to social platforms. Real OAuth integration requires platform-specific app review.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {Object.values(SOCIAL_PLATFORMS).map((platform) => {
          const status = connections[platform];
          const isConnected = status === 'Connected Placeholder';

          // Hide WhatsApp from providers (admin only)
          if (!isAdmin && platform === SOCIAL_PLATFORMS.WHATSAPP) return null;

          return (
            <div key={platform} className="border rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition">
              <div>
                <h3 className="font-semibold text-gray-800">{platform}</h3>
                <div className="flex items-center gap-1 mt-1">
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">
                      <CheckCircle2 size={12} /> {status}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      <Unlink size={12} /> {status}
                    </span>
                  )}
                </div>
              </div>

              <div>
                {isConnected ? (
                  <button 
                    onClick={() => handleDisconnect(platform)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 border border-red-100 rounded-md hover:bg-red-50 transition"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button 
                    onClick={() => handleConnect(platform)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 border border-blue-100 rounded-md hover:bg-blue-50 transition flex items-center gap-1"
                  >
                    <LinkIcon size={14} /> Connect Mock
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

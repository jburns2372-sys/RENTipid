'use client';

import React from 'react';
import Link from 'next/link';
import { Bot } from 'lucide-react';

interface ContextualAssistantLauncherProps {
  route: string;
  lifecycle?: string;
  entityId?: string;
  entityType?: string;
  label?: string;
  className?: string;
}

export function ContextualAssistantLauncher({
  route,
  lifecycle,
  entityId,
  entityType,
  label = 'Ask AI Support',
  className = ''
}: ContextualAssistantLauncherProps) {
  
  // Construct the secure context URL. 
  // We pass entityId and route, but server will independently verify ownership in /api/ai/chat.
  const searchParams = new URLSearchParams();
  searchParams.set('route', route);
  if (lifecycle) searchParams.set('lifecycle', lifecycle);
  if (entityId) searchParams.set('entityId', entityId);
  if (entityType) searchParams.set('entityType', entityType);

  const href = `/help?${searchParams.toString()}`;

  return (
    <Link 
      href={href}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors shadow-sm font-medium text-sm border border-blue-200 ${className}`}
    >
      <Bot className="w-4 h-4 text-blue-600" />
      {label}
    </Link>
  );
}

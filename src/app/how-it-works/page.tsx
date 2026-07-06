import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import HowItWorksClient from './HowItWorksClient';

export default function HowItWorksPage() {
  return (
    <div className="relative">
      <HowItWorksClient />
      
      {/* Position AIAssistantButton absolutely or let it handle its own fixed positioning */}
      <div className="container mx-auto px-4 max-w-3xl">
        <AIAssistantButton context="How It Works" />
      </div>
    </div>
  );
}

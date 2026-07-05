import React from 'react';
import { ArrowRight, Info } from 'lucide-react';
import Link from 'next/link';

interface NextActionCardProps {
  title: string;
  description: string;
  actionText: string;
  actionUrl?: string;
  onClick?: () => void;
  type?: 'info' | 'warning' | 'success';
}

export default function NextActionCard({
  title,
  description,
  actionText,
  actionUrl,
  onClick,
  type = 'info'
}: NextActionCardProps) {
  const getTheme = () => {
    switch (type) {
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'info':
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const themeClass = getTheme();

  return (
    <div className={`border rounded-xl p-5 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${themeClass}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Info size={20} />
        </div>
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm opacity-90 mt-1">{description}</p>
        </div>
      </div>
      <div className="shrink-0">
        {actionUrl ? (
          <Link 
            href={actionUrl}
            className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm border border-black/10 hover:bg-black/5 transition-colors"
          >
            {actionText} <ArrowRight size={16} />
          </Link>
        ) : (
          <button 
            onClick={onClick}
            className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm border border-black/10 hover:bg-black/5 transition-colors"
          >
            {actionText} <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'app');

const pages = [
  '/browse',
  '/how-it-works',
  '/safety',
  '/terms',
  '/privacy',
  '/prohibited-items',
  '/help',
  '/contact',
  '/login',
  '/register',
  '/register/individual',
  '/register/business',
  '/dashboard/renter',
  '/dashboard/provider',
  '/dashboard/business',
  '/dashboard/admin',
  '/dashboard/finance',
  '/dashboard/compliance',
  '/dashboard/super-admin'
];

const template = (title) => `import React from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';

export default function Page() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">${title}</h1>
      <p className="text-gray-600 mb-8">This is a placeholder page for the ${title} module. Full functionality will be implemented in subsequent phases.</p>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Module Content Area</h2>
        <div className="h-64 border-2 border-dashed border-gray-200 rounded-md flex items-center justify-center">
          <span className="text-gray-400">Content pending Phase 2/3</span>
        </div>
      </div>
      
      <AIAssistantButton context="${title}" />
    </div>
  );
}
`;

pages.forEach(pagePath => {
  const dirPath = path.join(baseDir, pagePath);
  fs.mkdirSync(dirPath, { recursive: true });
  
  // Create a title from the path
  const title = pagePath.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const formattedTitle = pagePath.includes('dashboard') ? `${title} Dashboard` : title;
  
  fs.writeFileSync(path.join(dirPath, 'page.tsx'), template(formattedTitle));
  console.log(`Created ${pagePath}/page.tsx`);
});

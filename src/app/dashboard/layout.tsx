import React from 'react';

// Force all dashboard routes to be dynamically rendered on each request.
// This prevents Next.js from attempting to statically execute Prisma queries 
// during the Vercel build phase where the database may be unreachable.
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import { redirect } from 'next/navigation';
import { requireAuthenticatedUser } from '@/lib/security/authorization';
import ActiveSessionsClient from '@/components/account/ActiveSessionsClient';

export default async function ActiveSessionsPage() {
  try { await requireAuthenticatedUser(); } catch { redirect('/login'); }
  return <ActiveSessionsClient />;
}

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { logPrivacyEvent } from '@/lib/privacy/privacy-workflow';

export default async function PrivacyAdminPage() {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  if ((session.user as { id: string; role?: string }).role !== 'Admin' && (session.user as { id: string; role?: string }).role !== 'Compliance Admin') {
    logPrivacyEvent({
      requestId: 'AUTH-REQ',
      requestType: 'PRIVACY_ADMIN_ACCESS_DENIED',
      actorId: (session.user as { id: string; role?: string }).id,
      status: 'DENIED',
      dataCategory: 'SYSTEM_ADMINISTRATION',
      decision: 'DENY',
      sanitizedReason: 'Unauthorized role attempt on privacy admin route'
    });
    return <div>Access Denied. You do not have permission to view this page.</div>;
  }

  logPrivacyEvent({
    requestId: 'AUTH-REQ',
    requestType: 'PRIVACY_ADMIN_ACCESSED',
    actorId: (session.user as { id: string; role?: string }).id,
    status: 'SUCCESS',
    dataCategory: 'SYSTEM_ADMINISTRATION',
    decision: 'ALLOW',
    sanitizedReason: 'Authorized privacy admin access'
  });

  return (
    <div>
      <h1>Privacy Administration Dashboard</h1>
      <p>Secure DSR management and legal holds.</p>
    </div>
  );
}

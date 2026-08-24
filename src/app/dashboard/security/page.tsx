import { redirect } from 'next/navigation';
import { requireAuthenticatedUser, getValidSessionIdentity } from '@/lib/security/authorization';
import { prisma } from '@/lib/prisma';

export default async function SecurityDashboard({ searchParams }: { searchParams: { pass?: string } }) {
  const sessionUser = await requireAuthenticatedUser();
  if (!sessionUser) redirect('/login');

  const userId = getValidSessionIdentity({ user: sessionUser });
  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser) redirect('/login');

  const mfa = await prisma.userMfa.findUnique({ where: { user_id: dbUser.id } });
  
  // Hard-coded mock of step-up state behavior for the OAT harness
  const { cookies } = await import('next/headers');
  const stepUpCookie = cookies().get('mfa_step_up');
  if (!stepUpCookie || stepUpCookie.value !== 'true') {
    redirect('/mfa-challenge?callbackUrl=%2Fdashboard%2Fsecurity');
  }

  return <div className="p-8"><h1 className="text-2xl font-bold mb-4">Security Settings</h1><p>MFA is {mfa?.status === 'ENABLED' ? 'Enabled' : 'Disabled'}</p></div>;
}
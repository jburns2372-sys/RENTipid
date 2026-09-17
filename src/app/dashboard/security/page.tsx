import { redirect } from 'next/navigation';
import { requireAuthenticatedUser, getValidSessionIdentity } from '@/lib/security/authorization';
import { prisma } from '@/lib/prisma';
import ConnectedLoginMethods from '@/components/profile/ConnectedLoginMethods';

export default async function SecurityDashboard() {
  const sessionUser = await requireAuthenticatedUser();
  if (!sessionUser) redirect('/login');

  const userId = getValidSessionIdentity({ user: sessionUser });
  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser) redirect('/login');

  const mfa = await prisma.userMfa.findUnique({ where: { user_id: dbUser.id } });

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Account Security</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Multi-Factor Authentication</h2>
        <p className="text-sm text-gray-600">
          Status: <span className="font-semibold text-gray-900">{mfa?.status === 'ENABLED' ? 'Enabled' : 'Disabled'}</span>
        </p>
      </div>

      <ConnectedLoginMethods />
    </div>
  );
}

import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";

export default async function SecuritySimulationsPage() {
  await requireSecurityPermission(SECURITY_PERMISSIONS.SIMULATIONS_RUN);

  return (
    <div className="p-8 bg-gray-900 rounded-lg border border-gray-800">
      <h1 className="text-2xl font-bold mb-4 text-white">Security Simulations</h1>
      <p className="text-gray-400">
        This module allows running security simulations and table-top exercises. Content is pending implementation.
      </p>
    </div>
  );
}

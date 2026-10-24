import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Shield } from "lucide-react";

const prisma = new PrismaClient();

export default async function ResponsesPage() {
  const authContext = await requireSecurityPermission(SECURITY_PERMISSIONS.RESPONSE_VIEW);

  const executions = await prisma.securityResponseExecution.findMany({
    take: 50,
    orderBy: { created_at: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-900 p-6 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-500" />
          Response Executions
        </h1>
      </div>

      <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Incident</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Target</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-gray-300">
            {executions.map(exec => (
              <tr key={exec.id} className="hover:bg-gray-800/50">
                <td className="p-4">
                  <Link href={`/dashboard/admin/security/responses/${exec.id}`} className="text-blue-400 hover:underline">
                    {exec.id.substring(0,8)}...
                  </Link>
                </td>
                <td className="p-4">{exec.incident_case_id.substring(0,8)}...</td>
                <td className="p-4">{exec.response_type}</td>
                <td className="p-4">{exec.target_type}: {exec.target_id.substring(0,8)}...</td>
                <td className="p-4">{exec.status}</td>
                <td className="p-4">{exec.created_at.toLocaleString()}</td>
              </tr>
            ))}
            {executions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">No response executions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

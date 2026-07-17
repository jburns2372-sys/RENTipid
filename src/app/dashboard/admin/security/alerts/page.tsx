import { AlertReviewService } from "@/lib/security/rules/alert-review.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AlertsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return redirect("/login");
  }

  let alertsResponse;
  try {
    alertsResponse = await AlertReviewService.getAlerts(((session as any).user as any).id, 50);
  } catch (e: any) {
    if (e.message.includes("Requires Super Admin role") || e.message.includes("Verified")) {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-4">You do not have the required permissions to view security alerts.</p>
        </div>
      );
    }
    throw e;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Security Alerts Review</h1>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {alertsResponse.alerts.map(alert => (
              <tr key={alert.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{alert.alert_reference}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.final_severity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.review_status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.rule_id} v{alert.rule_version}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(alert.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {alertsResponse.alerts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No alerts found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

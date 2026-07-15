import { Loader2 } from "lucide-react";

export default function SecurityLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-4">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      <h2 className="text-xl font-medium text-white tracking-tight animate-pulse">
        Verifying Security Context...
      </h2>
      <p className="text-gray-500 text-sm max-w-sm">
        Establishing database-authoritative permissions.
      </p>
    </div>
  );
}

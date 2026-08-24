"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle } from "lucide-react";

export default function MfaChallengePage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerifying(true);

    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify MFA");
      }
      
      // Verification successful, return user to the originally protected destination where existing authorization flow supports it.
      const urlParams = new URLSearchParams(window.location.search);
      let callbackUrl = urlParams.get("callbackUrl") || "/dashboard";
      
      // Ensure the redirect is relative and not an open redirect vulnerability
      if (!callbackUrl.startsWith("/")) {
        callbackUrl = "/dashboard";
      }
      
      router.push(callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify MFA");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6 text-center">
          <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold tracking-tight">Security Check</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Please verify your identity to access this secure area.
          </p>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-md p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-medium text-red-800 dark:text-red-400">Error</h5>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your 6-digit authenticator code or a 12-character recovery code.
            </p>
            <input 
              type="text" 
              autoComplete="one-time-code"
              placeholder="000000" 
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-center text-lg tracking-widest"
              required
              disabled={verifying}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={verifying || token.length < 6}>
            {verifying ? "Verifying..." : "Verify Identity"}
          </Button>
        </form>
      </div>
    </div>
  );
}

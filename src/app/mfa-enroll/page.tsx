"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle } from "lucide-react";

export default function MfaEnrollPage() {
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchSecret() {
      try {
        const res = await fetch("/api/auth/mfa/enroll", { method: "POST" });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to initiate enrollment");
        }
        const data = await res.json();
        setSecret(data.secret);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch secret");
      } finally {
        setLoading(false);
      }
    }
    fetchSecret();
  }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setActivating(true);

    try {
      const res = await fetch("/api/auth/mfa/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to activate MFA");
      }
      
      // Activation successful
      setSecret(null); // Clear secret from memory
      setToken(""); // Clear token
      setRecoveryCodes(data.recoveryCodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate MFA");
    } finally {
      setActivating(false);
    }
  };

  const handleFinish = () => {
    setRecoveryCodes(null);
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Two-Factor Authentication</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Initiating secure setup...</p>
          </div>
        </div>
      </div>
    );
  }

  if (recoveryCodes) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-green-500/20 p-6">
          <div className="mb-6 text-center">
            <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold tracking-tight">MFA Activated Successfully</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Your account is now protected with Time-Based Two-Factor Authentication.
            </p>
          </div>
          
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-md p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-medium text-yellow-800 dark:text-yellow-400">Save your recovery codes</h5>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                These codes are the ONLY way to access your account if you lose your device. We will not show them again.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-6">
            {recoveryCodes.map((code, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-900 p-2 text-center rounded font-mono text-sm tracking-widest border border-gray-200 dark:border-gray-700">
                {code}
              </div>
            ))}
          </div>
          
          <Button className="w-full" onClick={handleFinish}>
            I have safely recorded these codes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Set Up Two-Factor Authentication</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Protect your RENTipid account by requiring a Time-Based One-Time Password (TOTP) when signing in.
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

        {secret && (
          <div className="space-y-6 text-left">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">1. Open your Authenticator App</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use an app like Google Authenticator, Authy, or Microsoft Authenticator.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">2. Enter this Secret Key manually</h3>
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700 flex justify-center">
                <code className="text-lg font-mono tracking-widest text-primary break-all text-center">
                  {secret}
                </code>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Time-Based (TOTP) &bull; RENTipid
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">3. Verify the generated code</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Enter the 6-digit code from your app to confirm setup.
              </p>
              <form onSubmit={handleActivate} className="flex gap-2">
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000" 
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-center text-lg tracking-widest"
                  required
                  disabled={activating}
                />
                <Button type="submit" disabled={activating || token.length !== 6}>
                  {activating ? "Activating..." : "Activate"}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

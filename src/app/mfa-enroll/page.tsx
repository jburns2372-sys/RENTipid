"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>Initiating secure setup...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (recoveryCodes) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md shadow-lg border-green-500/20">
          <CardHeader className="text-center">
            <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">MFA Activated Successfully</CardTitle>
            <CardDescription>
              Your account is now protected with Time-Based Two-Factor Authentication.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-400">Save your recovery codes</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                These codes are the ONLY way to access your account if you lose your device. We will not show them again.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-2 mb-6">
              {recoveryCodes.map((code, i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 p-2 text-center rounded font-mono text-sm tracking-widest border border-gray-200 dark:border-gray-700">
                  {code}
                </div>
              ))}
            </div>
            
            <Button className="w-full" onClick={handleFinish}>
              I have safely recorded these codes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Set Up Two-Factor Authentication</CardTitle>
          <CardDescription>
            Protect your RENTipid account by requiring a Time-Based One-Time Password (TOTP) when signing in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!error && secret && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">1. Open your Authenticator App</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Use an app like Google Authenticator, Authy, or Microsoft Authenticator.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">2. Enter this Secret Key manually</h3>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 flex justify-center">
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
                  <Input 
                    type="text" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000" 
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="font-mono text-center text-lg tracking-widest"
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
        </CardContent>
      </Card>
    </div>
  );
}

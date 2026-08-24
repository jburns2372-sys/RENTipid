"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
          <CardTitle>Security Check</CardTitle>
          <CardDescription>
            Please verify your identity to access this secure area.
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

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your 6-digit authenticator code or a 12-character recovery code.
              </p>
              <Input 
                type="text" 
                autoComplete="one-time-code"
                placeholder="000000" 
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono text-center text-lg tracking-widest"
                required
                disabled={verifying}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={verifying || token.length < 6}>
              {verifying ? "Verifying..." : "Verify Identity"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

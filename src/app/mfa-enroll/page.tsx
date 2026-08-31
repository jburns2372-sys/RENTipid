"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle, QrCode as QrCodeIcon, KeyRound, Copy, Check } from "lucide-react";
import Image from "next/image";

export default function MfaEnrollPage() {
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showManualKey, setShowManualKey] = useState(false);
  const [copied, setCopied] = useState(false);
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
        setQrCode(data.qrCode || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch secret");
      } finally {
        setLoading(false);
      }
    }
    fetchSecret();
  }, []);

  const handleCopySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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
      setQrCode(null);
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
    router.push("/dashboard/super-admin");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Two-Factor Authentication</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Generating secure QR Code...</p>
          </div>
        </div>
      </div>
    );
  }

  if (recoveryCodes) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-green-500/20 p-8">
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
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="mb-6 text-center">
          <div className="inline-flex p-3 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 mb-3">
            <QrCodeIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Set Up Two-Factor Authentication</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Scan the QR code with your Authenticator App (Google Authenticator, Microsoft Authenticator, or Authy).
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

        {(qrCode || secret) && (
          <div className="space-y-6 text-left">
            {/* Step 1: QR Code */}
            {qrCode ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">1. Scan this QR Code</h3>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
                  <img
                    src={qrCode}
                    alt="MFA QR Code"
                    width={200}
                    height={200}
                    className="w-48 h-48 rounded-lg"
                  />
                  <span className="text-xs text-gray-400 mt-2 font-medium">Time-Based (TOTP) &bull; RENTipid</span>
                </div>
              </div>
            ) : null}

            {/* Manual Secret Key Toggle */}
            {secret && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowManualKey(!showManualKey)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 font-medium"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {showManualKey ? "Hide manual secret key" : "Can't scan the QR code? Enter secret manually"}
                </button>

                {showManualKey && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2 animate-in fade-in duration-200">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Account: Super Admin (RENTipid)</p>
                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2.5 rounded border font-mono text-xs tracking-wider text-gray-800 dark:text-gray-200 break-all">
                      <span>{secret}</span>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="ml-2 p-1 text-gray-500 hover:text-blue-600 transition shrink-0"
                        title="Copy secret"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Verification Code */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">2. Enter 6-digit Authenticator Code</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Enter the numerical code currently shown in your authenticator app.
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
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-center tracking-widest font-semibold"
                  required
                  disabled={activating}
                  autoFocus
                />
                <Button type="submit" className="h-11 px-5 font-semibold" disabled={activating || token.length !== 6}>
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


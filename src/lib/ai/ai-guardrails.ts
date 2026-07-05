export const BLOCKED_KEYWORDS = [
  "approve kyc",
  "publish listing",
  "verify payment",
  "release deposit",
  "deduct deposit",
  "decide dispute",
  "suspend user",
  "blacklist user",
  "delete audit",
  "reveal password",
  "show secret",
  "api key",
  "env variable",
  "bypass role",
  "trigger refund",
  "process refund",
  "real refund",
  "trigger payout",
  "process payout",
  "release payout",
  "real payout",
  "override finance",
  "payment key",
  "gateway secret",
  "change ledger",
  "live payment"
];

export function checkGuardrails(prompt: string): { isSafe: boolean; reason?: string } {
  const lowerPrompt = prompt.toLowerCase();
  
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowerPrompt.includes(keyword)) {
      return { 
        isSafe: false, 
        reason: "I cannot perform that action directly. A qualified authorized user must review and approve it. I can help summarize the information or prepare a checklist." 
      };
    }
  }

  return { isSafe: true };
}

/**
 * RENTipid GLCC v1.0 — Multilingual AI Security & Guardrails
 *
 * Work Package: GLCC-P8
 * Acceptance Target: AI-02
 *
 * Implements:
 * 1. Multilingual prompt injection & jailbreak detection across English, Filipino, Spanish, Japanese, Chinese.
 * 2. Role escalation defense: blocks attempts to manipulate actor roles regardless of language.
 * 3. Financial override defense: blocks attempts to waive fees, bypass payments, or alter ledger truth.
 * 4. System prompt extraction protection.
 * 5. Fail-closed security evaluation returning auditable classifications.
 */

import type {
  MultilingualSecurityEvaluation,
  MultilingualAttackClass,
} from './ai-localization-contracts';

interface AttackPattern {
  readonly pattern: RegExp;
  readonly attackClass: MultilingualAttackClass;
  readonly riskLevel: 'HIGH' | 'CRITICAL';
  readonly description: string;
}

const MULTILINGUAL_ATTACK_PATTERNS: AttackPattern[] = [
  // 1. Prompt Injections & Jailbreaks (EN, FIL, ES, JA, ZH)
  {
    pattern: /ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions/i,
    attackClass: 'PROMPT_INJECTION',
    riskLevel: 'CRITICAL',
    description: 'English instruction override attempt',
  },
  {
    pattern: /balewalain\s+(?:ang\s+)?(?:lahat\s+ng\s+)?(?:nakaraang\s+)?tagubilin/i,
    attackClass: 'PROMPT_INJECTION',
    riskLevel: 'CRITICAL',
    description: 'Filipino instruction override attempt',
  },
  {
    pattern: /ignora\s+(?:todas\s+las\s+)?instrucciones\s+previas/i,
    attackClass: 'PROMPT_INJECTION',
    riskLevel: 'CRITICAL',
    description: 'Spanish instruction override attempt',
  },
  {
    pattern: /(?:これまでの|過去の)指示を(?:すべて)?無視/i,
    attackClass: 'PROMPT_INJECTION',
    riskLevel: 'CRITICAL',
    description: 'Japanese instruction override attempt',
  },
  {
    pattern: /忽略.{0,10}?(?:指示|指令|提示)/i,
    attackClass: 'PROMPT_INJECTION',
    riskLevel: 'CRITICAL',
    description: 'Chinese instruction override attempt',
  },

  // 2. Delimiter & Persona Hijacking
  {
    pattern: /(?:<\|im_start\|>|<\|system\|>|\[SYSTEM_OVERRIDE\])/i,
    attackClass: 'PROMPT_INJECTION',
    riskLevel: 'CRITICAL',
    description: 'LLM delimiter injection',
  },
  {
    pattern: /(?:you\s+are\s+now|ikaw\s+ngayon\s+ay|ahora\s+eres|お前は今から|你现在是)\s+(?:DAN|developer|admin|god|unrestricted)/i,
    attackClass: 'PROMPT_INJECTION',
    riskLevel: 'CRITICAL',
    description: 'Persona jailbreak attempt',
  },

  // 3. System Prompt Extraction
  {
    pattern: /(?:reveal|show|print|display|dump)\s+(?:your\s+)?(?:system\s+prompt|initial\s+prompt|hidden\s+instructions)/i,
    attackClass: 'SYSTEM_PROMPT_EXTRACTION',
    riskLevel: 'HIGH',
    description: 'English system prompt extraction',
  },
  {
    pattern: /(?:ipakita|ilabas|ibunyag)\s+ang\s+(?:lihim\s+na\s+)?(?:system\s+prompt|instruksyon)/i,
    attackClass: 'SYSTEM_PROMPT_EXTRACTION',
    riskLevel: 'HIGH',
    description: 'Filipino system prompt extraction',
  },
  {
    pattern: /(?:システムプロンプト|内部指示)を表示/i,
    attackClass: 'SYSTEM_PROMPT_EXTRACTION',
    riskLevel: 'HIGH',
    description: 'Japanese system prompt extraction',
  },

  // 4. Role Escalation
  {
    pattern: /(?:grant\s+me|give\s+me|make\s+me|switch\s+to)\s+(?:admin|super[-_ ]?admin|finance_officer|compliance_officer)/i,
    attackClass: 'ROLE_ESCALATION',
    riskLevel: 'CRITICAL',
    description: 'English role escalation',
  },
  {
    pattern: /(?:gawin\s+akong|bigyan\s+ako\s+ng|i-set\s+ang\s+role\s+ko\s+sa)\s+(?:admin|super[-_ ]?admin|opisyal)/i,
    attackClass: 'ROLE_ESCALATION',
    riskLevel: 'CRITICAL',
    description: 'Filipino role escalation',
  },
  {
    pattern: /(?:otórgame|hazme|dame)\s+rol\s+de\s+(?:admin|administrador|superadmin)/i,
    attackClass: 'ROLE_ESCALATION',
    riskLevel: 'CRITICAL',
    description: 'Spanish role escalation',
  },
  {
    pattern: /(?:管理者権限|スーパー管理者)(?:を与えて|に昇格)/i,
    attackClass: 'ROLE_ESCALATION',
    riskLevel: 'CRITICAL',
    description: 'Japanese role escalation',
  },

  // 5. Financial Policy Override & Fraud Attempt
  {
    pattern: /(?:waive\s+fee|set\s+price\s+to\s+0|bypass\s+payment|instant\s+refund\s+without\s+approval)/i,
    attackClass: 'FINANCIAL_OVERRIDE',
    riskLevel: 'CRITICAL',
    description: 'English financial bypass',
  },
  {
    pattern: /(?:patawarin\s+ang\s+bayad|i-libre\s+ang\s+renta|laktawan\s+ang\s+bayad|i-refund\s+agad)/i,
    attackClass: 'FINANCIAL_OVERRIDE',
    riskLevel: 'CRITICAL',
    description: 'Filipino financial bypass',
  },
  {
    pattern: /(?:anular\s+tarifa|reembolso\s+sin\s+aprobación|omitir\s+pago)/i,
    attackClass: 'FINANCIAL_OVERRIDE',
    riskLevel: 'CRITICAL',
    description: 'Spanish financial bypass',
  },

  // 6. KYC & Safety Bypass
  {
    pattern: /(?:bypass|skip|ignore)\s+(?:kyc|identity\s+verification|id\s+check)/i,
    attackClass: 'KYC_BYPASS',
    riskLevel: 'CRITICAL',
    description: 'English KYC bypass',
  },
  {
    pattern: /(?:laktawan|i-bypass|ipasa\s+nang\s+walang\s+id)\s+ang\s+kyc/i,
    attackClass: 'KYC_BYPASS',
    riskLevel: 'CRITICAL',
    description: 'Filipino KYC bypass',
  },
];

export class MultilingualGuardrails {
  /**
   * Evaluates input text for multilingual prompt injection, role escalation, or financial tampering.
   */
  public static evaluateInput(text: string): MultilingualSecurityEvaluation {
    if (!text || typeof text !== 'string') {
      return { isAllowed: true, riskLevel: 'LOW' };
    }

    const trimmed = text.trim();

    for (const item of MULTILINGUAL_ATTACK_PATTERNS) {
      if (item.pattern.test(trimmed)) {
        return {
          isAllowed: false,
          attackClass: item.attackClass,
          riskLevel: item.riskLevel,
          matchedPattern: item.pattern.source,
          reason: `Security violation detected (${item.description})`,
        };
      }
    }

    return {
      isAllowed: true,
      riskLevel: 'LOW',
    };
  }
}

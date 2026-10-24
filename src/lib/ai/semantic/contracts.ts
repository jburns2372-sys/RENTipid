export type SemanticConceptType =
  | 'CATEGORY'
  | 'INTENT'
  | 'ROLE'
  | 'LIFECYCLE'
  | 'PROCESS'
  | 'DOMAIN_TERM'
  | 'POLICY_TERM';

export type SemanticSource = 'TAXONOMY' | 'KNOWLEDGE_METADATA' | 'CONTROLLED_REGISTRY';
export type SemanticAudience = 'CUSTOMER' | 'INTERNAL' | 'SYSTEM';
export type SemanticStatus = 'ACTIVE' | 'DEPRECATED' | 'PROPOSED';
export type SemanticMatchType = 'EXACT' | 'ALIAS' | 'ABBREVIATION' | 'NORMALIZED' | 'TYPO' | 'CONTEXTUAL';
export type SemanticConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SemanticLexiconEntry {
  canonicalId: string;
  canonicalTerm: string;
  type: SemanticConceptType;
  domain: string;
  aliases: string[];
  abbreviations: string[];
  commonMisspellings: string[];
  colloquialForms: string[];
  audience: SemanticAudience;
  source: SemanticSource;
  status: SemanticStatus;
  version: string;
  ambiguityGroup?: string;
}

export interface SemanticMatch {
  inputTerm: string;
  canonicalId: string;
  canonicalTerm: string;
  matchType: SemanticMatchType;
  confidence: SemanticConfidence;
  source: SemanticSource;
}

export interface SemanticEntityMatch extends SemanticMatch {
  entityType?: string;
}

export interface AmbiguousSemanticTerm {
  inputTerm: string;
  candidates: SemanticMatch[];
}

export interface SemanticContextBundle {
  lexiconVersion: string;
  originalText: string;
  normalizedText: string;
  answerClassHints: string[];
  intentHints: SemanticMatch[];
  entities: SemanticEntityMatch[];
  roleHints: SemanticMatch[];
  lifecycleHints: SemanticMatch[];
  retrievalExpansions: string[];
  ambiguousTerms: AmbiguousSemanticTerm[];
  unresolvedTerms: string[];
}

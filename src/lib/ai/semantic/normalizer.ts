import { FULL_LEXICON, CONTROLLED_REGISTRY_VERSION } from './lexicon-registry';
import type { 
  SemanticContextBundle, 
  SemanticMatch, 
  SemanticEntityMatch, 
  AmbiguousSemanticTerm,
  SemanticLexiconEntry
} from './contracts';

// Optional Levenshtein distance for bounded typo recovery
function levenshtein(a: string, b: string): number {
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + indicator
      );
    }
  }
  return matrix[a.length][b.length];
}

export interface NormalizerConfig {
  enabled: boolean;
  maxExpansions: number;
  fuzzyMatchEnabled: boolean;
}

function normalizePhrase(text: string): string {
  // Normalize case, whitespace, basic punctuation
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) || [];
}

export function parseSemanticContext(
  originalText: string, 
  config: NormalizerConfig
): SemanticContextBundle {
  if (!config.enabled) {
    return {
      lexiconVersion: CONTROLLED_REGISTRY_VERSION,
      originalText,
      normalizedText: normalizePhrase(originalText),
      answerClassHints: [],
      intentHints: [],
      entities: [],
      roleHints: [],
      lifecycleHints: [],
      retrievalExpansions: [],
      ambiguousTerms: [],
      unresolvedTerms: [],
    };
  }

  const normalizedText = normalizePhrase(originalText);
  const words = tokenize(normalizedText);
  
  const matches: SemanticMatch[] = [];
  const ambiguousGroups = new Map<string, SemanticMatch[]>();
  const matchedOriginals = new Set<string>();

  // A simple strategy: check n-grams up to 4 words
  const ngrams: { phrase: string; originalTokens: string[] }[] = [];
  for (let len = 4; len >= 1; len--) {
    for (let i = 0; i <= words.length - len; i++) {
      const phrase = words.slice(i, i + len).join(' ');
      ngrams.push({ phrase, originalTokens: words.slice(i, i + len) });
    }
  }

  for (const { phrase } of ngrams) {
    if (matchedOriginals.has(phrase)) continue; // skip if already matched part of it

    let foundMatches: SemanticMatch[] = [];
    let isAmbiguous = false;
    let ambiguityGroupName = '';

    for (const entry of FULL_LEXICON) {
      const isExact = normalizePhrase(entry.canonicalTerm) === phrase;
      const isAlias = entry.aliases.some(a => normalizePhrase(a) === phrase) || entry.colloquialForms.some(a => normalizePhrase(a) === phrase);
      const isAbbrev = entry.abbreviations.some(a => normalizePhrase(a) === phrase);
      const isTypo = entry.commonMisspellings.some(a => normalizePhrase(a) === phrase);
      
      let isFuzzy = false;
      if (config.fuzzyMatchEnabled && !isExact && !isAlias && !isAbbrev && !isTypo && phrase.length > 4) {
        // Only fuzzy match on main term or aliases if distance <= 1 for single words, 2 for longer
        const maxDist = phrase.length > 7 ? 2 : 1;
        if (levenshtein(normalizePhrase(entry.canonicalTerm), phrase) <= maxDist) isFuzzy = true;
        else if (entry.aliases.some(a => levenshtein(normalizePhrase(a), phrase) <= maxDist)) isFuzzy = true;
      }

      if (isExact || isAlias || isAbbrev || isTypo || isFuzzy) {
        const matchType = isExact ? 'EXACT' : isAlias ? 'ALIAS' : isAbbrev ? 'ABBREVIATION' : isTypo ? 'TYPO' : 'TYPO'; // Fallback fuzzy to TYPO
        const confidence = (isExact || isAlias || isAbbrev) ? 'HIGH' : isTypo ? 'MEDIUM' : 'LOW';
        
        const match: SemanticMatch = {
          inputTerm: phrase,
          canonicalId: entry.canonicalId,
          canonicalTerm: entry.canonicalTerm,
          matchType,
          confidence,
          source: entry.source
        };

        if (entry.ambiguityGroup) {
          isAmbiguous = true;
          ambiguityGroupName = entry.ambiguityGroup;
        }

        foundMatches.push(match);
      }
    }

    if (foundMatches.length > 0) {
      matchedOriginals.add(phrase);
      // Check ambiguity
      if (isAmbiguous && foundMatches.length > 1) {
        // It's ambiguous!
        const existing = ambiguousGroups.get(phrase) || [];
        ambiguousGroups.set(phrase, [...existing, ...foundMatches]);
      } else {
        // Filter out matches if they resolve to the same canonicalId
        const uniqueMatches = Array.from(new Map(foundMatches.map(m => [m.canonicalId, m])).values());
        
        if (uniqueMatches.length > 1) {
           // Inherently ambiguous (multiple distinct canonical IDs matched same phrase)
           ambiguousGroups.set(phrase, uniqueMatches);
        } else {
           matches.push(uniqueMatches[0]);
        }
      }
    }
  }

  const intentHints = matches.filter(m => getEntryType(m.canonicalId) === 'INTENT' || getEntryType(m.canonicalId) === 'PROCESS');
  const roleHints = matches.filter(m => getEntryType(m.canonicalId) === 'ROLE');
  const lifecycleHints = matches.filter(m => getEntryType(m.canonicalId) === 'LIFECYCLE');
  const entities = matches.filter(m => getEntryType(m.canonicalId) === 'CATEGORY').map(m => ({ ...m, entityType: 'CATEGORY' }));
  
  const ambiguousTerms: AmbiguousSemanticTerm[] = Array.from(ambiguousGroups.entries()).map(([term, cands]) => ({
    inputTerm: term,
    candidates: Array.from(new Map(cands.map(c => [c.canonicalId, c])).values()) // unique candidates
  }));

  // Build bounded retrieval expansions
  const expansions = new Set<string>();
  for (const match of matches) {
    if (expansions.size >= config.maxExpansions) break;
    expansions.add(normalizePhrase(match.canonicalTerm));
    const entry = FULL_LEXICON.find(e => e.canonicalId === match.canonicalId);
    if (entry) {
      for (const alias of entry.aliases.slice(0, 2)) { // take top 2 aliases to bound expansion
        if (expansions.size >= config.maxExpansions) break;
        expansions.add(normalizePhrase(alias));
      }
    }
  }

  // Find unresolved terms (words > 4 chars not part of any match)
  const unresolvedTerms = words.filter(w => w.length > 4 && !Array.from(matchedOriginals).some(phrase => phrase.includes(w)));

  return {
    lexiconVersion: CONTROLLED_REGISTRY_VERSION,
    originalText,
    normalizedText,
    answerClassHints: [],
    intentHints,
    entities,
    roleHints,
    lifecycleHints,
    retrievalExpansions: Array.from(expansions).slice(0, config.maxExpansions),
    ambiguousTerms,
    unresolvedTerms
  };
}

function getEntryType(canonicalId: string) {
  return FULL_LEXICON.find(e => e.canonicalId === canonicalId)?.type;
}

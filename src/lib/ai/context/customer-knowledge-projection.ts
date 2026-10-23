export type KnowledgeAudience = 'CUSTOMER' | 'INTERNAL' | 'SYSTEM';

export interface AudienceContentBlock {
  audience: KnowledgeAudience;
  content: string;
}

const EXPLICIT_AUDIENCE = /^\s*\[(?:audience\s*:\s*)?(CUSTOMER|INTERNAL|SYSTEM)]\s*/i;
const INTERNAL_SECTION =
  /\b(?:implementation|governance|registry|adapter|provider mechanics|test fixtures?|negative fixtures?|sample data|database|migration|freeze|telemetry|oat|debug|ingestion|data flow|action matrix|orchestrator|gateway enforcement|fallback\s*\/\s*block|policy engine|blueprint|executive overview|purpose and safety|role training|training and quick guides?|permission guidance|unified ai authority|retention governance|module approved safe state|full documentation|full technical|technical[^>]{0,40}documentation|compliance register|jurisdiction status model|jurisdiction profiles?|pending validation|evidence and related manuals?)\b/i;
const SYSTEM_SECTION = /\b(?:system prompt|secrets?|credentials?|private keys?|security controls?|rbac internals?)\b/i;
const INTERNAL_STATEMENT =
  /(?:\b(?:source\s*key|chunk\s*(?:id|key)|registry|freeze hash|adapter|mock provider|domain authority|deterministic policy|internal specialist|taxonomy fields?|provider reads|reads only|ingest(?:ed|ion)?|negative test|test fixtures?|sample users?|sample bookings?|booking mutation|database|migration|implementation detail|canonical|oat|phase\s*\d+|pass\s*\d*)\b|\b(?:subtitle|author|lang)\s*:|\bexamples?\s*:)/i;
const SYSTEM_STATEMENT = /\b(?:api key|client secret|private key|password hash|session token|system prompt)\b/i;
const INTERNAL_SHAPE =
  /(?:\b(?:src|docs|tests|prisma)\/|\b[A-Z][A-Z0-9_]{4,}\b|\x60[^\x60]*(?:\/|\.[a-z]{1,5})[^\x60]*\x60)/;
const INTERNAL_SOURCE = /^(?:ai\.ai-service-action-matrix|core\.executive-overview|core\.role-training-guides|insurance\.(?:full-documentation|privacy-data-flow)|provider\.(?:rbac|ai-policy|privacy-policy-retention|insurance-config-catalog))$/i;

function explicitAudience(value: string): KnowledgeAudience | undefined {
  const marker = value.match(EXPLICIT_AUDIENCE)?.[1]?.toUpperCase();
  return marker === 'CUSTOMER' || marker === 'INTERNAL' || marker === 'SYSTEM'
    ? marker
    : undefined;
}

export function classifyKnowledgeAudience(content: string, headingPath = ''): KnowledgeAudience {
  const explicit = explicitAudience(content) ?? explicitAudience(headingPath);
  if (explicit) return explicit;
  const leafHeading = headingPath.split('>').map(value => value.trim()).filter(Boolean).at(-1) ?? headingPath;
  if (SYSTEM_SECTION.test(leafHeading) || SYSTEM_STATEMENT.test(content)) return 'SYSTEM';
  if (INTERNAL_SECTION.test(leafHeading)
    || INTERNAL_STATEMENT.test(content)
    || INTERNAL_SHAPE.test(content)) return 'INTERNAL';
  return 'CUSTOMER';
}

export function classifyKnowledgeSourceAudience(sourceKey: string): KnowledgeAudience {
  return INTERNAL_SOURCE.test(sourceKey) ? 'INTERNAL' : 'CUSTOMER';
}

function withoutAudienceMarker(value: string): string {
  return value.replace(EXPLICIT_AUDIENCE, '').trim();
}

function customerHeading(value: string): string {
  return value
    .replace(/\bmarketplace category taxonomy\b/i, 'Rental Categories')
    .replace(/\btaxonomy\b/gi, 'categories');
}

export function splitKnowledgeAudienceBlocks(
  content: string,
  headingPath = '',
): AudienceContentBlock[] {
  const blocks: AudienceContentBlock[] = [];
  let activeHeading = headingPath;
  let activeAudience = classifyKnowledgeAudience('', headingPath);

  const push = (audience: KnowledgeAudience, value: string) => {
    const clean = withoutAudienceMarker(value);
    if (!clean) return;
    const previous = blocks.at(-1);
    if (previous?.audience === audience) {
      previous.content += `\n${clean}`;
    } else {
      blocks.push({ audience, content: clean });
    }
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading) {
      activeHeading = heading[2];
      activeAudience = classifyKnowledgeAudience(line, activeHeading);
      if (activeAudience === 'CUSTOMER') push('CUSTOMER', `${heading[1]} ${customerHeading(heading[2])}`);
      continue;
    }

    const prefix = line.match(/^(?:\d+[.)]|[-*])\s+/)?.[0] ?? '';
    const body = prefix ? line.slice(prefix.length) : line;
    const sentences = body.split(/(?<=[.!?])\s+/).filter(Boolean);
    for (const sentence of sentences) {
      const audience = explicitAudience(sentence)
        ?? (activeAudience !== 'CUSTOMER'
          ? activeAudience
          : classifyKnowledgeAudience(sentence, activeHeading));
      push(audience, `${prefix}${sentence}`);
    }
  }
  return blocks;
}

export function isOrdinaryCustomerRole(role: string | undefined): boolean {
  const normalized = (role ?? 'Guest').trim().toLowerCase().replace(/_/g, ' ');
  return [
    'guest',
    'renter',
    'provider',
    'individual provider',
    'business provider',
  ].includes(normalized);
}

export function isCustomerAnswerableText(value: string): boolean {
  return classifyKnowledgeAudience(value) === 'CUSTOMER';
}

export function projectCustomerAnswerableText(content: string, headingPath = ''): string {
  return splitKnowledgeAudienceBlocks(content, headingPath)
    .filter(block => block.audience === 'CUSTOMER')
    .map(block => block.content)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function isMixedKnowledgeContent(content: string, headingPath = ''): boolean {
  const audiences = new Set(splitKnowledgeAudienceBlocks(content, headingPath).map(block => block.audience));
  return audiences.has('CUSTOMER') && (audiences.has('INTERNAL') || audiences.has('SYSTEM'));
}

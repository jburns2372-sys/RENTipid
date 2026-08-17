const INTERNAL_SECTION =
  /\b(?:implementation|governance|registry|adapter|provider mechanics|test fixtures?|negative fixtures?|sample data|database|migration|freeze|telemetry|oat)\b/i;

const INTERNAL_STATEMENT =
  /(?:\b(?:source\s*key|chunk\s*(?:id|key)|registry|freeze hash|adapter|mock provider|domain authority|deterministic policy|internal specialist|taxonomy fields?|provider reads|reads only|ingest(?:ed|ion)?|negative test|test fixtures?|sample users?|sample bookings?|booking mutation|database|migration|implementation detail|canonical|oat|phase\s*\d+|pass\s*\d*)\b|\bexamples?\s*:)/i;

const INTERNAL_SHAPE =
  /(?:\b(?:src|docs|tests|prisma)\/|\b[A-Z][A-Z0-9_]{4,}\b|\x60[^\x60]*(?:\/|\.[a-z]{1,5})[^\x60]*\x60)/;

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
  return !INTERNAL_STATEMENT.test(value) && !INTERNAL_SHAPE.test(value);
}

export function projectCustomerAnswerableText(content: string, headingPath = ''): string {
  if (INTERNAL_SECTION.test(headingPath)) return '';
  const projected: string[] = [];
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      if (projected.at(-1) !== '') projected.push('');
      continue;
    }
    if (/^#{1,6}\s+/.test(line)) {
      const customerHeading = line
        .replace(/\bmarketplace category taxonomy\b/i, 'Rental Categories')
        .replace(/\btaxonomy\b/gi, 'categories');
      if (!INTERNAL_SECTION.test(customerHeading)) projected.push(customerHeading);
      continue;
    }
    const prefix = line.match(/^(?:\d+[.)]|[-*])\s+/)?.[0] ?? '';
    const body = prefix ? line.slice(prefix.length) : line;
    const safeSentences = body
      .split(/(?<=[.!?])\s+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence && isCustomerAnswerableText(sentence));
    if (safeSentences.length > 0) projected.push(prefix + safeSentences.join(' '));
  }
  return projected.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

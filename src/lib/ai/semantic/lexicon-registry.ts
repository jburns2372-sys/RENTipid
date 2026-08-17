import type { SemanticLexiconEntry } from './contracts';

export const CONTROLLED_REGISTRY_VERSION = 'v1.1-SCL-01';

const CATEGORIES: SemanticLexiconEntry[] = [
  {
    canonicalId: 'condominiums-apartments',
    canonicalTerm: 'Condominiums & Apartments',
    type: 'CATEGORY',
    domain: 'Marketplace',
    aliases: ['condo', 'condominium', 'apartment', 'flat', 'unit'],
    abbreviations: ['apt'],
    commonMisspellings: ['condominum', 'appartment'],
    colloquialForms: ['my place'],
    audience: 'CUSTOMER',
    source: 'TAXONOMY',
    status: 'ACTIVE',
    version: CONTROLLED_REGISTRY_VERSION,
  },
  {
    canonicalId: 'car-vehicle',
    canonicalTerm: 'Car',
    type: 'CATEGORY',
    domain: 'Marketplace',
    aliases: ['automobile', 'auto', 'vehicle', 'car'],
    abbreviations: [],
    commonMisspellings: [],
    colloquialForms: ['my ride', 'my car'],
    audience: 'CUSTOMER',
    source: 'TAXONOMY',
    status: 'ACTIVE',
    version: CONTROLLED_REGISTRY_VERSION,
  },
  {
    canonicalId: 'motorcycle-vehicle',
    canonicalTerm: 'Motorcycle',
    type: 'CATEGORY',
    domain: 'Marketplace',
    aliases: ['motorbike', 'motorcycle', 'scooter'],
    abbreviations: ['moto'],
    commonMisspellings: ['motorcyle'],
    colloquialForms: ['my bike'],
    audience: 'CUSTOMER',
    source: 'TAXONOMY',
    status: 'ACTIVE',
    version: CONTROLLED_REGISTRY_VERSION,
    ambiguityGroup: 'bike', // Could be bicycle or motorcycle
  },
  {
    canonicalId: 'bicycle-vehicle',
    canonicalTerm: 'Bicycle',
    type: 'CATEGORY',
    domain: 'Marketplace',
    aliases: ['bicycle', 'pushbike'],
    abbreviations: [],
    commonMisspellings: ['biycle'],
    colloquialForms: ['my bike'],
    audience: 'CUSTOMER',
    source: 'TAXONOMY',
    status: 'ACTIVE',
    version: CONTROLLED_REGISTRY_VERSION,
    ambiguityGroup: 'bike',
  }
];

const INTENTS: SemanticLexiconEntry[] = [
  {
    canonicalId: 'PROVIDER_PAYOUT_PROCESS',
    canonicalTerm: 'Provider Payout Process',
    type: 'INTENT',
    domain: 'Payments',
    aliases: ['cash out', 'get paid', 'receive money', 'withdraw funds', 'payout', 'earnings'],
    abbreviations: [],
    commonMisspellings: [],
    colloquialForms: ['cash out my earnings', 'where is my money'],
    audience: 'CUSTOMER',
    source: 'CONTROLLED_REGISTRY',
    status: 'ACTIVE',
    version: CONTROLLED_REGISTRY_VERSION,
  },
  {
    canonicalId: 'CREATE_LISTING',
    canonicalTerm: 'Create Listing',
    type: 'INTENT',
    domain: 'Marketplace',
    aliases: ['put my item up', 'create a listing', 'rent out', 'list my item', 'add a listing'],
    abbreviations: [],
    commonMisspellings: [],
    colloquialForms: ['put up for rent', 'post my thing'],
    audience: 'CUSTOMER',
    source: 'CONTROLLED_REGISTRY',
    status: 'ACTIVE',
    version: CONTROLLED_REGISTRY_VERSION,
  },
  {
    canonicalId: 'BOOKING_PROCESS',
    canonicalTerm: 'Booking Process',
    type: 'INTENT',
    domain: 'Marketplace',
    aliases: ['book an item', 'reserve', 'make a booking'],
    abbreviations: [],
    commonMisspellings: [],
    colloquialForms: ['rent something', 'get an item'],
    audience: 'CUSTOMER',
    source: 'CONTROLLED_REGISTRY',
    status: 'ACTIVE',
    version: CONTROLLED_REGISTRY_VERSION,
  },
  {
    canonicalId: 'REGISTRATION',
    canonicalTerm: 'Registration',
    type: 'INTENT',
    domain: 'Core',
    aliases: ['sign up', 'register', 'create account', 'join rentipid', 'become a provider', 'become a renter'],
    abbreviations: [],
    commonMisspellings: ['sing up', 'reigster'],
    colloquialForms: [],
    audience: 'CUSTOMER',
    source: 'CONTROLLED_REGISTRY',
    status: 'ACTIVE',
    version: CONTROLLED_REGISTRY_VERSION,
  }
];

const LIFECYCLES: SemanticLexiconEntry[] = [
  {
    canonicalId: 'EXISTING_PROVIDER',
    canonicalTerm: 'Existing Provider',
    type: 'LIFECYCLE',
    domain: 'Core',
    aliases: ['already a provider', 'existing provider', 'active provider'],
    abbreviations: [],
    commonMisspellings: [],
    colloquialForms: ["I'm a provider", 'already rent out'],
    audience: 'CUSTOMER',
    source: 'CONTROLLED_REGISTRY',
    status: 'ACTIVE',
    version: CONTROLLED_REGISTRY_VERSION,
  },
  {
    canonicalId: 'NEW_USER',
    canonicalTerm: 'New User',
    type: 'LIFECYCLE',
    domain: 'Core',
    aliases: ['new user', 'newcomer', 'just joined'],
    abbreviations: [],
    commonMisspellings: [],
    colloquialForms: ["I'm new here"],
    audience: 'CUSTOMER',
    source: 'CONTROLLED_REGISTRY',
    status: 'ACTIVE',
    version: CONTROLLED_REGISTRY_VERSION,
  }
];

export const FULL_LEXICON: SemanticLexiconEntry[] = [
  ...CATEGORIES,
  ...INTENTS,
  ...LIFECYCLES,
];

export function getLexiconEntry(canonicalId: string): SemanticLexiconEntry | undefined {
  return FULL_LEXICON.find(entry => entry.canonicalId === canonicalId);
}

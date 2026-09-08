import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { getKnowledgeRegistry } from '../src/lib/ai/knowledge/source-registry';
import { BOTS, ROLE_BOT_ACCESS } from '../src/lib/ai/ai-permissions';

export interface DiscoveredAppInventory {
  discoveredAt: string;
  modules: string[];
  features: string[];
  roles: string[];
  audiences: string[];
  answerClasses: string[];
  authorityTypes: string[];
  knowledgeSourceKeys: string[];
  bots: string[];
}

export function discoverAppInventory(root = process.cwd()): DiscoveredAppInventory {
  // 1. Discover Knowledge Registry sources & modules
  const registryEntries = getKnowledgeRegistry(root);
  const knowledgeSourceKeys = Array.from(new Set(registryEntries.map(e => e.sourceKey))).sort();
  const rawModules = Array.from(new Set(registryEntries.map(e => e.module)));
  
  // Standardized modules list based on repository inspection & registry
  const modules = Array.from(new Set([
    ...rawModules,
    'Account',
    'Listings',
    'Bookings',
    'Payments',
    'Insurance',
    'Trust & Safety',
    'Privacy',
    'Security',
    'Social & Marketing',
    'Admin',
    'Finance',
    'Compliance',
    'KYC',
    'Disputes',
    'Support',
    'Core Architecture'
  ])).sort();

  // 2. Discover features
  const features = Array.from(new Set([
    'authentication',
    'password_reset',
    'profile_management',
    'listing_creation',
    'listing_review',
    'listing_management',
    'prohibited_items',
    'booking_flow',
    'booking_cancellation',
    'booking_extension',
    'payment_processing',
    'refund_processing',
    'security_deposit',
    'provider_payout',
    'insurance_coverage',
    'insurance_claim',
    'identity_verification_kyc',
    'damage_reporting',
    'renter_provider_mediation',
    'social_marketing',
    'admin_operations',
    'knowledge_management',
    'release_gate_verification',
    'tool_gateway_execution',
    'system_diagnostics'
  ])).sort();

  // 3. Discover roles & audiences from ai-permissions
  const roles = Object.keys(ROLE_BOT_ACCESS).sort();
  const audiences = ['RENTER', 'PROVIDER', 'ADMIN', 'INTERNAL', 'PUBLIC'];

  // 4. Standard answer classes & authority types as per Unified AI v1.1
  const answerClasses = [
    'INFORMATION',
    'ELIGIBILITY_POLICY',
    'PERSONALIZED_READ',
    'ACTION',
    'UNSUPPORTED_EXTERNAL'
  ];

  const authorityTypes = [
    'KNOWLEDGE_CENTER',
    'POLICY_TAXONOMY',
    'LIVE_SERVICE',
    'TOOL_GATEWAY'
  ];

  const bots = Object.values(BOTS).sort();

  return {
    discoveredAt: new Date().toISOString(),
    modules,
    features,
    roles,
    audiences,
    answerClasses,
    authorityTypes,
    knowledgeSourceKeys,
    bots,
  };
}

if (require.main === module) {
  const inventory = discoverAppInventory();
  const targetDir = resolve(process.cwd(), 'src/lib/ai/knowledge');
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }
  const targetPath = resolve(targetDir, 'discovered-app-inventory.json');
  writeFileSync(targetPath, JSON.stringify(inventory, null, 2), 'utf8');
  console.log(`✅ App inventory discovered successfully: ${inventory.modules.length} modules, ${inventory.knowledgeSourceKeys.length} knowledge source keys.`);
}

/**
 * RENTipid Canonical Reference Categories
 * Source of truth for core platform categories and draft resolution.
 */

export interface CanonicalCategoryDefinition {
  readonly name: string;
  readonly slug: string;
  readonly risk_level: 'Low' | 'Medium' | 'High' | 'Regulated';
  readonly description?: string;
  readonly requires_admin_approval?: boolean;
  readonly requires_deposit?: boolean;
  readonly requires_insurance?: boolean;
  readonly requires_permit?: boolean;
}

export const CANONICAL_CATEGORIES: readonly CanonicalCategoryDefinition[] = [
  {
    name: 'Tools',
    slug: 'tools',
    risk_level: 'Low',
    description: 'Power tools, hand tools, and gardening equipment.',
  },
  {
    name: 'Construction Equipment',
    slug: 'construction-equipment',
    risk_level: 'Medium',
    description: 'Scaffolding, cement mixers, and generators.',
    requires_deposit: true,
  },
  {
    name: 'Heavy Equipment',
    slug: 'heavy-equipment',
    risk_level: 'High',
    requires_admin_approval: true,
    requires_deposit: true,
    requires_insurance: true,
  },
  {
    name: 'Event Equipment',
    slug: 'event-equipment',
    risk_level: 'Low',
    description: 'Tents, chairs, tables, and sound systems.',
  },
  {
    name: 'Cameras and Gadgets',
    slug: 'cameras-and-gadgets',
    risk_level: 'Medium',
    requires_deposit: true,
  },
  {
    name: 'Cars and Motorcycles',
    slug: 'cars-and-motorcycles',
    risk_level: 'Regulated',
    requires_admin_approval: true,
    requires_deposit: true,
    requires_insurance: true,
    requires_permit: true,
  },
  {
    name: 'Trucks and Commercial Vehicles',
    slug: 'trucks-and-commercial-vehicles',
    risk_level: 'Regulated',
    requires_admin_approval: true,
    requires_deposit: true,
    requires_insurance: true,
    requires_permit: true,
  },
  {
    name: 'Condominiums',
    slug: 'condominiums',
    risk_level: 'Regulated',
    requires_admin_approval: true,
    requires_deposit: true,
    requires_permit: true,
  },
  {
    name: 'Rooms',
    slug: 'rooms',
    risk_level: 'Medium',
    requires_deposit: true,
  },
  {
    name: 'Beach Resorts',
    slug: 'beach-resorts',
    risk_level: 'Regulated',
    requires_admin_approval: true,
    requires_deposit: true,
    requires_permit: true,
  },
  {
    name: 'Event Venues',
    slug: 'event-venues',
    risk_level: 'Medium',
    requires_deposit: true,
  },
  {
    name: 'Office Equipment',
    slug: 'office-equipment',
    risk_level: 'Low',
  },
  {
    name: 'Boats',
    slug: 'boats',
    risk_level: 'Regulated',
    requires_admin_approval: true,
    requires_deposit: true,
    requires_insurance: true,
    requires_permit: true,
  },
  {
    name: 'Aircraft / Helicopter Charter Inquiry Only',
    slug: 'aircraft-charter',
    risk_level: 'Regulated',
    requires_admin_approval: true,
    requires_deposit: true,
    requires_insurance: true,
    requires_permit: true,
  },
  {
    name: 'Other Legally Rentable Assets',
    slug: 'other',
    risk_level: 'Medium',
  },
] as const;

export const CANONICAL_CATEGORY_SLUGS = CANONICAL_CATEGORIES.map((c) => c.slug);

/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Market Domain Index
 *
 * Exposes the Global Jurisdiction & Market Capability Framework:
 * - Contracts (Capabilities, Statuses, Activation States, Jurisdiction Profiles)
 * - Capability Registry (All 46 jurisdictions derived directly from GLCC)
 * - Activation Gate (Fail-closed commercial activation validation)
 */

export * from './contracts';
export * from './activation/market-activation-gate';
export * from './registry/market-capability-registry';
export * from './account';


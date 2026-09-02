export type ProfileProviderIdentity = {
  id: string;
  provider: string;
  email?: string | null;
  email_verified?: boolean | null;
};

const SYNTHETIC_EMAIL_DOMAIN = '@identity.rentipid.invalid';
const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  facebook: 'Facebook',
  apple: 'Apple',
};

export function isSyntheticIdentityEmail(email: string | null | undefined): boolean {
  return typeof email === 'string' && email.trim().toLowerCase().endsWith(SYNTHETIC_EMAIL_DOMAIN);
}

function isSafeDisplayEmail(email: string | null | undefined): email is string {
  if (!email || isSyntheticIdentityEmail(email)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function providerOrder(provider: string): number {
  return PROVIDER_LABELS[provider] ? Object.keys(PROVIDER_LABELS).indexOf(provider) : Object.keys(PROVIDER_LABELS).length;
}

function compareIdentities(left: ProfileProviderIdentity, right: ProfileProviderIdentity): number {
  const verifiedOrder = Number(Boolean(right.email_verified)) - Number(Boolean(left.email_verified));
  if (verifiedOrder !== 0) return verifiedOrder;

  const providerOrderDifference = providerOrder(left.provider) - providerOrder(right.provider);
  if (providerOrderDifference !== 0) return providerOrderDifference;

  return left.id.localeCompare(right.id);
}

export function resolveProfileDisplayEmail(
  userEmail: string | null | undefined,
  identities: ProfileProviderIdentity[],
): string {
  if (userEmail && !isSyntheticIdentityEmail(userEmail)) return userEmail;

  const orderedIdentities = [...identities].sort(compareIdentities);
  const displayIdentity = orderedIdentities.find((identity) => isSafeDisplayEmail(identity.email));
  if (displayIdentity?.email) return displayIdentity.email.trim();

  const providerIdentity = orderedIdentities.find((identity) => PROVIDER_LABELS[identity.provider]);
  if (providerIdentity) return `Signed in with ${PROVIDER_LABELS[providerIdentity.provider]}`;

  return 'No public email available';
}

/**
 * Safe Internal Redirect Validator
 * 
 * Validates and sanitizes internal redirect URLs for authentication, MFA, and SOC gates.
 * Enforces strict same-origin internal paths while preventing:
 * - Open redirects (https://evil.com, http://evil.com)
 * - Protocol-relative bypasses (//evil.com, /\\evil.com, \\evil.com)
 * - Dangerous schemes (javascript:, data:, vbscript:)
 * - Control characters / CRLF header injection (%00, \r, \n)
 * - Encoded bypass attacks (%2f%2f, %5c)
 * - Bare /dashboard redirects (which causes 404s since no index page exists)
 */

export function getSafeInternalRedirect(
  targetUrl: string | null | undefined,
  fallback: string = '/dashboard/admin/security'
): string {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return fallback;
  }

  const trimmed = targetUrl.trim();
  if (!trimmed) {
    return fallback;
  }

  // Must start with a single "/" and never "//", "/\\", or "\\"
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.startsWith('\\')
  ) {
    return fallback;
  }

  // Reject schemes or colons in the path part (e.g. javascript:, data:, https:)
  const [pathOnly] = trimmed.split('?');
  const [cleanPath] = pathOnly.split('#');
  if (cleanPath.includes(':')) {
    return fallback;
  }

  // Reject control characters or newlines
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return fallback;
  }

  // Reject URL-encoded bypasses (%2f%2f, %5c%5c, %00, etc.)
  try {
    const decoded = decodeURIComponent(trimmed);
    if (
      decoded.startsWith('//') ||
      decoded.startsWith('/\\') ||
      decoded.startsWith('\\') ||
      decoded.split('?')[0].split('#')[0].includes(':') ||
      /[\x00-\x1F\x7F]/.test(decoded)
    ) {
      return fallback;
    }
  } catch {
    // Malformed URI encoding
    return fallback;
  }

  // Reject bare /dashboard or /dashboard/ as it has no index page (404)
  if (cleanPath === '/dashboard' || cleanPath === '/dashboard/') {
    return fallback;
  }

  return trimmed;
}

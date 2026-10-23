export function normalizeLoginCallbackUrl(
  callbackUrl: string | null | undefined,
  currentOrigin?: string,
): string {
  if (!callbackUrl) {
    return '/';
  }

  const trimmed = callbackUrl.trim();
  if (!trimmed) {
    return '/';
  }

  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\')) {
      return '/';
    }
    if (trimmed === '/dashboard' || trimmed === '/dashboard/' || trimmed === '/login' || trimmed === '/login/') {
      return '/';
    }
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (currentOrigin && parsed.origin === currentOrigin) {
      const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      if (path === '/dashboard' || path === '/dashboard/' || parsed.pathname === '/login' || parsed.pathname === '/login/') {
        return '/';
      }
      return path;
    }
  } catch {
    // Fall back to the safe default for malformed callback URLs.
  }

  return '/';
}

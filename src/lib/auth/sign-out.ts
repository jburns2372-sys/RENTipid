'use client';

import { signOut } from 'next-auth/react';

export async function signOutWithStepUpCleanup(callbackUrl = '/'): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
    });
  } catch {
    // The legacy hint is not an authorization source; sign-out must still proceed.
  } finally {
    await signOut({ callbackUrl });
  }
}

/**
 * RENTipid GLCC v1.0 — Public Guest Global Preferences API Route
 *
 * Endpoint: /api/preferences
 * Methods: GET, PATCH, PUT
 */

import { createGuestPreferencesRouteHandlers } from '@/lib/glcc/guest-preferences-handlers';

export const dynamic = 'force-dynamic';

const defaultGuestHandlers = createGuestPreferencesRouteHandlers();

export const GET = defaultGuestHandlers.GET;
export const PATCH = defaultGuestHandlers.PATCH;
export const PUT = defaultGuestHandlers.PUT;

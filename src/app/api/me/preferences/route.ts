/**
 * RENTipid GLCC v1.0 — Authenticated User Global Preferences API Route
 *
 * Endpoint: /api/me/preferences
 * Methods: GET, PATCH, PUT
 */

import { createPreferencesRouteHandlers } from '@/lib/glcc/me-preferences-handlers';

export const dynamic = 'force-dynamic';

const defaultHandlers = createPreferencesRouteHandlers();

export const GET = defaultHandlers.GET;
export const PATCH = defaultHandlers.PATCH;
export const PUT = defaultHandlers.PUT;

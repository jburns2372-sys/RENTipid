/**
 * RENTipid GLCC v1.0 — Read-Only Browse FX Presentation Endpoint
 *
 * Route: GET /api/fx/estimate
 * Work Package: GLCC-P5B
 *
 * Security & Financial Boundaries:
 * 1. Read-only presentation endpoint.
 * 2. Accepts: sourceAmount, sourceCurrency, targetCurrency.
 * 3. Enforces Server as Rate Authority:
 *    - Rejects any client attempt to submit rate, normalizedRate, providerRef,
 *      chargeCurrency, settlementCurrency, or targetAmount (400 Bad Request).
 *    - Caller cannot choose provider; server internally chooses approved CurrencyAPI.
 * 4. Gated by glcc_fx_display_enabled feature flag (403 Forbidden if disabled).
 * 5. Returns exact money representation in DTO; zero binary-float arithmetic.
 * 6. Fails safe: if rate unavailable, returns canonical currency with isEstimateAvailable: false.
 * 7. Zero database writes, zero booking writes, zero payment operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBrowseFxEstimate } from '@/lib/glcc/browse-fx-service';
import { evaluateGlccFeatureFlags } from '@/lib/glcc/feature-flags';
import { sanitizeDecimalString } from '@/lib/glcc/fx-math';

const FORBIDDEN_CLIENT_PARAMS = Object.freeze([
  'rate',
  'normalizedrate',
  'rawrate',
  'provider',
  'providerid',
  'providerref',
  'ratesourceref',
  'providerobservedat',
  'targetamount',
  'chargecurrency',
  'settlementcurrency',
  'ledgercurrency',
]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Security Check: Reject prohibited caller-supplied parameters
    for (const param of searchParams.keys()) {
      if (FORBIDDEN_CLIENT_PARAMS.includes(param.toLowerCase())) {
        return NextResponse.json(
          {
            error: `Prohibited parameter '${param}': caller cannot supply rate authority or financial settlement fields`,
          },
          { status: 400 }
        );
      }
    }

    // 2. Feature Flag Check: glcc_fx_display_enabled
    const flags = await evaluateGlccFeatureFlags();
    if (!flags.fxDisplayEnabled) {
      return NextResponse.json(
        {
          error: 'GLCC FX display estimation is currently disabled',
          isEstimateAvailable: false,
        },
        { status: 403 }
      );
    }

    // 3. Extract and Validate Input Parameters
    const sourceAmountRaw = searchParams.get('sourceAmount') || searchParams.get('amount');
    const sourceCurrencyRaw = searchParams.get('sourceCurrency') || 'PHP';
    const targetCurrencyRaw = searchParams.get('targetCurrency');

    if (!sourceAmountRaw) {
      return NextResponse.json(
        { error: 'Missing required query parameter: sourceAmount' },
        { status: 400 }
      );
    }

    if (!targetCurrencyRaw) {
      return NextResponse.json(
        { error: 'Missing required query parameter: targetCurrency' },
        { status: 400 }
      );
    }

    let sanitizedAmount: string;
    try {
      sanitizedAmount = sanitizeDecimalString(sourceAmountRaw);
    } catch {
      return NextResponse.json(
        { error: `Invalid numeric sourceAmount: '${sourceAmountRaw}'` },
        { status: 400 }
      );
    }

    // 4. Resolve Estimate via Server Presentation Service
    const estimate = await getBrowseFxEstimate({
      sourceAmount: sanitizedAmount,
      sourceCurrency: sourceCurrencyRaw,
      targetCurrency: targetCurrencyRaw,
      skipFlagCheck: true, // Already verified above
    });

    return NextResponse.json(estimate, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[GLCC /api/fx/estimate] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error while resolving FX estimate' },
      { status: 500 }
    );
  }
}

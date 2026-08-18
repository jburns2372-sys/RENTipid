"use client";

import { useEffect, useState } from "react";

interface CheckoutOffer {
  offerId: string;
  productCode: string;
  currency: string;
  premiumMinor: number;
  disclosureVersion: string;
  expiresAt: string;
  mock: boolean;
}

export function InsuranceCheckoutOption(props: {
  bookingId: string;
  requestId: string;
}) {
  const [offer, setOffer] = useState<CheckoutOffer | null>(null);
  const [selected, setSelected] = useState(false);
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/insurance/offers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        bookingId: props.bookingId,
        requestId: props.requestId,
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = (await response.json()) as {
          status?: string;
          offers?: CheckoutOffer[];
        };
        return payload.status === "AVAILABLE" ? payload.offers?.[0] ?? null : null;
      })
      .then((value) => setOffer(value))
      .catch(() => setOffer(null));
    return () => controller.abort();
  }, [props.bookingId, props.requestId]);

  if (!offer) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        Insurance is optional and currently unavailable. Rental checkout remains
        available without Insurance.
      </div>
    );
  }

  return (
    <fieldset className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <legend className="px-1 text-sm font-semibold text-blue-950">
        Optional Insurance
      </legend>
      <label className="flex items-start gap-3 text-sm text-blue-950">
        <input
          type="checkbox"
          name="insurance_selected"
          value="true"
          checked={selected}
          onChange={(event) => {
            setSelected(event.target.checked);
            if (!event.target.checked) setConsented(false);
          }}
          className="mt-1"
        />
        <span>
          Add the non-live {offer.productCode} engineering offer for{" "}
          {(offer.premiumMinor / 100).toLocaleString("en-PH", {
            style: "currency",
            currency: offer.currency,
          })}
          . This amount is presented separately and is not silently added to the
          rental payment.
        </span>
      </label>
      {selected ? (
        <label className="mt-3 flex items-start gap-3 text-sm text-blue-950">
          <input
            type="checkbox"
            name="insurance_consent"
            value="true"
            checked={consented}
            onChange={(event) => setConsented(event.target.checked)}
            required
            className="mt-1"
          />
          <span>
            I affirmatively accept disclosure {offer.disclosureVersion} and the
            displayed premium. This box is not preselected.
          </span>
        </label>
      ) : null}
      <input type="hidden" name="insurance_offer_id" value={offer.offerId} />
      <input
        type="hidden"
        name="insurance_disclosure_version"
        value={offer.disclosureVersion}
      />
      <input
        type="hidden"
        name="insurance_premium_minor"
        value={offer.premiumMinor}
      />
      <input type="hidden" name="insurance_currency" value={offer.currency} />
      <p className="mt-2 text-xs text-blue-800">
        Offer expires {new Date(offer.expiresAt).toLocaleString()}. Mock offers
        never represent live insurer approval or coverage.
      </p>
    </fieldset>
  );
}

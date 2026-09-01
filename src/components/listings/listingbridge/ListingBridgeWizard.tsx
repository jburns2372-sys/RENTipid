"use client";

import React, { useState } from 'react';
import type { ConnectorOptionDTO } from '@/lib/listingbridge/ui/actions';
import type {
  ListingBridgeReviewSnapshot,
  ReviewFieldModel,
} from '@/lib/listingbridge/review/types';
import type { ListingBridgeConfidenceState } from '@/lib/listingbridge/types/canonical-contract';

export type ListingBridgeWizardStage =
  | 'SOURCE_SELECTION'
  | 'RIGHTS_CONFIRMATION'
  | 'IMPORTING'
  | 'REVIEW_DETAILS'
  | 'DRAFT_READY';

export interface ListingBridgeWizardProps {
  readonly initialConnectors?: readonly ConnectorOptionDTO[];
  readonly initialSnapshot?: ListingBridgeReviewSnapshot | null;
  readonly onManualFallback?: () => void;
  readonly onDraftHandoffPrepared?: (handoffData: { importJobId: string; isReady: boolean }) => void;
  readonly onDraftCreated?: (result: { listingId: string; importJobId: string }) => void;
}

export default function ListingBridgeWizard({
  initialConnectors = [],
  initialSnapshot = null,
  onManualFallback,
  onDraftHandoffPrepared,
  onDraftCreated,
}: ListingBridgeWizardProps) {
  const [stage, setStage] = useState<ListingBridgeWizardStage>(
    initialSnapshot ? 'REVIEW_DETAILS' : 'SOURCE_SELECTION',
  );
  const [selectedConnectorId, setSelectedConnectorId] = useState<string>(
    initialConnectors[0]?.id || '',
  );
  const [rightsConfirmed, setRightsConfirmed] = useState<boolean>(false);
  const [activeSnapshot, setActiveSnapshot] = useState<ListingBridgeReviewSnapshot | null>(
    initialSnapshot,
  );
  const [editingField, setEditingField] = useState<ReviewFieldModel | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [correctionError, setCorrectionError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);

  // Confidence state badge mapping with high contrast and accessible text
  const getBadgeForConfidence = (state: ListingBridgeConfidenceState) => {
    switch (state) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✓ Verified
          </span>
        );
      case 'HIGH_CONFIDENCE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            Imported
          </span>
        );
      case 'REVIEW_RECOMMENDED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            ⚠️ Please review
          </span>
        );
      case 'CONFLICT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            ⛔ Conflict found
          </span>
        );
      case 'MISSING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            ❓ Missing required
          </span>
        );
      case 'PROHIBITED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            🚫 Excluded (Policy)
          </span>
        );
    }
  };

  const handleStartImport = () => {
    setStage('RIGHTS_CONFIRMATION');
  };

  const handleConfirmRights = () => {
    if (!rightsConfirmed) return;
    setStage('IMPORTING');

    // Simulate progress transition in client for demonstration/test
    setTimeout(() => {
      if (!activeSnapshot) {
        // Sample baseline snapshot for demonstration
        const sampleSnapshot: ListingBridgeReviewSnapshot = {
          importJobId: 'job-lb-demo-001',
          providerId: 'provider-current',
          jobStatus: 'NEEDS_REVIEW',
          fields: [
            {
              fieldName: 'title',
              displayName: 'Listing Title',
              normalizedValue: 'Spacious 2BR Suite near Ayala Triangle',
              confidenceState: 'HIGH_CONFIDENCE',
              isRequired: true,
              isBlocking: false,
              providerModified: false,
              validationState: 'VALIDATED',
              allowedActions: ['CONFIRM', 'EDIT'],
            },
            {
              fieldName: 'description',
              displayName: 'Description',
              normalizedValue: 'Cozy two-bedroom unit with fast WiFi, air conditioning, and city view.',
              confidenceState: 'HIGH_CONFIDENCE',
              isRequired: true,
              isBlocking: false,
              providerModified: false,
              validationState: 'VALIDATED',
              allowedActions: ['CONFIRM', 'EDIT'],
            },
            {
              fieldName: 'propertyType',
              displayName: 'Property Type',
              normalizedValue: 'condominiums',
              confidenceState: 'REVIEW_RECOMMENDED',
              isRequired: true,
              isBlocking: false,
              providerModified: false,
              validationState: 'VALIDATED',
              allowedActions: ['CONFIRM', 'EDIT'],
            },
          ],
          unresolvedItems: [],
          media: {
            totalCandidates: 2,
            validatedCount: 2,
            rejectedCount: 0,
            duplicateCount: 0,
            hasCoverPhoto: true,
            isBlocking: false,
          },
          location: {
            normalizedAddress: {
              addressLine1: 'Ayala Avenue',
              addressLine2: null,
              sublocality: null,
              locality: 'Makati',
              administrativeArea2: null,
              administrativeArea1: 'Metro Manila',
              postalCode: '1226',
              countryCode: 'PH',
              formattedAddress: 'Ayala Avenue, Makati, Metro Manila',
              latitude: 14.5547,
              longitude: 121.0244,
              provider: 'MANUAL',
              providerPlaceId: null,
              validationStatus: 'VERIFIED',
              validationLevel: null,
              manuallyEdited: false,
              validatedAt: null,
            },
            isWithinPhilippineBounds: true,
            conflicts: [],
            isBlocking: false,
            requiresReview: false,
          },
          duplicate: {
            matchLevel: 'NO_MATCH',
            confidenceScore: 0,
            signals: [],
            isBlocking: false,
            requiresReview: false,
          },
          rights: {
            rightsConfirmed: true,
            isBlocking: false,
          },
          readiness: {
            isReadyForDraft: true,
            blockingReasons: [],
            warningReasons: ['Field propertyType is recommended for review'],
            resolvedFieldsCount: 3,
            unresolvedBlockingCount: 0,
          },
        };
        setActiveSnapshot(sampleSnapshot);
      }
      setStage('REVIEW_DETAILS');
    }, 600);
  };

  const handleOpenEdit = (field: ReviewFieldModel) => {
    if (field.confidenceState === 'PROHIBITED') return;
    setEditingField(field);
    setEditValue(typeof field.normalizedValue === 'string' ? field.normalizedValue : JSON.stringify(field.normalizedValue || ''));
    setCorrectionError('');
  };

  const handleSaveCorrection = () => {
    if (!editingField || !activeSnapshot) return;

    if (!editValue.trim()) {
      setCorrectionError('Value cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setCorrectionError('');

    // Update field locally and recompute readiness
    const updatedFields = activeSnapshot.fields.map((f) => {
      if (f.fieldName === editingField.fieldName) {
        return {
          ...f,
          normalizedValue: editValue.trim(),
          confidenceState: 'VERIFIED' as const,
          providerModified: true,
          validationState: 'VALIDATED' as const,
          isBlocking: false,
        };
      }
      return f;
    });

    const updatedSnapshot: ListingBridgeReviewSnapshot = {
      ...activeSnapshot,
      fields: updatedFields,
      readiness: {
        ...activeSnapshot.readiness,
        isReadyForDraft: true,
        blockingReasons: activeSnapshot.readiness.blockingReasons.filter(
          (r) => !r.includes(editingField.fieldName),
        ),
      },
    };

    setActiveSnapshot(updatedSnapshot);
    setEditingField(null);
    setIsSubmitting(false);
  };

  const handleProceedToDraftReady = () => {
    if (!activeSnapshot || !activeSnapshot.readiness.isReadyForDraft) return;
    setStage('DRAFT_READY');
    if (onDraftHandoffPrepared) {
      onDraftHandoffPrepared({
        importJobId: activeSnapshot.importJobId,
        isReady: true,
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 font-sans">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            RENTipid ListingBridge
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Bring an Existing Listing into RENTipid
          </h1>
        </div>
        {onManualFallback && (
          <button
            type="button"
            onClick={onManualFallback}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          >
            ← Build listing manually instead
          </button>
        )}
      </div>

      {/* Stage 1: Source Selection */}
      {stage === 'SOURCE_SELECTION' && (
        <section aria-labelledby="source-selection-heading" className="space-y-6">
          <h2 id="source-selection-heading" className="text-lg font-semibold text-gray-900">
            Choose where to import your listing from
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initialConnectors.map((connector) => (
              <label
                key={connector.id}
                className={`flex flex-col p-4 border rounded-xl cursor-pointer transition ${
                  selectedConnectorId === connector.id
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">{connector.name}</div>
                  <input
                    type="radio"
                    name="connector"
                    value={connector.id}
                    checked={selectedConnectorId === connector.id}
                    onChange={() => setSelectedConnectorId(connector.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">{connector.description}</p>
                <span className="mt-3 inline-block text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded w-fit">
                  {connector.tier.replace(/_/g, ' ')}
                </span>
              </label>
            ))}

            {/* Manual listing fallback card */}
            <div
              onClick={onManualFallback}
              className="flex flex-col p-4 border border-dashed border-gray-300 rounded-xl hover:border-gray-400 bg-gray-50/60 cursor-pointer transition justify-between"
            >
              <div>
                <div className="font-semibold text-gray-900">Create New Listing Directly</div>
                <p className="text-sm text-gray-600 mt-2">
                  Start fresh with our step-by-step listing creation wizard.
                </p>
              </div>
              <span className="mt-3 text-xs font-semibold text-gray-700 underline">
                Open standard wizard →
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleStartImport}
              disabled={!selectedConnectorId}
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
            >
              Continue to Authorization →
            </button>
          </div>
        </section>
      )}

      {/* Stage 2: Rights Confirmation */}
      {stage === 'RIGHTS_CONFIRMATION' && (
        <section aria-labelledby="rights-heading" className="space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 id="rights-heading" className="text-lg font-bold text-gray-900">
            Confirm Listing Authority & Media Rights
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Before importing details into RENTipid, please verify that you hold legitimate management authority
            for this property and own or have explicit permission to use all submitted photos and content.
          </p>

          <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rightsConfirmed}
                onChange={(e) => setRightsConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm text-gray-800">
                I confirm that I am authorized to list this property on RENTipid, that all information provided is accurate to the best of my knowledge, and that I have the right to use and distribute all associated media.
              </span>
            </label>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setStage('SOURCE_SELECTION')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirmRights}
              disabled={!rightsConfirmed}
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              Begin Secure Import
            </button>
          </div>
        </section>
      )}

      {/* Stage 3: Importing Progress */}
      {stage === 'IMPORTING' && (
        <section aria-live="polite" className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
          <h2 className="text-lg font-bold text-gray-900">Importing Listing Details</h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Connecting securely, reading listing specifications, checking photos, and organizing fields for your review...
          </p>
        </section>
      )}

      {/* Stage 4: Review Details */}
      {stage === 'REVIEW_DETAILS' && activeSnapshot && (
        <section aria-labelledby="review-heading" className="space-y-6">
          {/* Readiness & Blocker Banner */}
          {activeSnapshot.readiness.blockingReasons.length > 0 ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-2">
              <div className="font-bold flex items-center gap-2">
                <span>⛔</span> Action Required Before Draft Creation
              </div>
              <ul className="list-disc list-inside text-sm space-y-1 text-rose-800">
                {activeSnapshot.readiness.blockingReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <div>
                  <div className="font-bold">All Required Fields Ready</div>
                  <div className="text-xs text-emerald-700">
                    You can review details below or proceed directly to draft readiness.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleProceedToDraftReady}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition"
              >
                Proceed to Draft →
              </button>
            </div>
          )}

          {/* Location Conflict Notice */}
          {activeSnapshot.location.conflicts.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
              <div className="font-bold">⚠️ Location Notice</div>
              {activeSnapshot.location.conflicts.map((c, i) => (
                <p key={i} className="text-sm">{c.message}</p>
              ))}
            </div>
          )}

          {/* Duplicate Notice */}
          {activeSnapshot.duplicate.matchLevel !== 'NO_MATCH' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
              <div className="font-bold">ℹ️ Property Duplicate Intelligence</div>
              <p className="text-sm">
                Possible existing listing match detected ({activeSnapshot.duplicate.matchLevel}).
              </p>
            </div>
          )}

          {/* Fields Review Table/Cards */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h2 id="review-heading" className="font-bold text-gray-900">
                Imported Listing Information
              </h2>
              <span className="text-xs text-gray-500">
                Job ID: {activeSnapshot.importJobId}
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {activeSnapshot.fields.map((field) => (
                <div
                  key={field.fieldName}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50/50 transition"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900">
                        {field.displayName}
                      </span>
                      {getBadgeForConfidence(field.confidenceState)}
                      {field.providerModified && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          Edited by you
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700 break-words">
                      {field.confidenceState === 'PROHIBITED' ? (
                        <span className="text-gray-400 italic">
                          This field cannot be imported under RENTipid safety policy.
                        </span>
                      ) : (
                        typeof field.normalizedValue === 'object'
                          ? JSON.stringify(field.normalizedValue)
                          : String(field.normalizedValue || '(None)')
                      )}
                    </div>
                  </div>

                  {field.allowedActions.includes('EDIT') && field.confidenceState !== 'PROHIBITED' && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(field)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition"
                    >
                      Edit field
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Media Review Summary */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-3">
            <h3 className="font-bold text-gray-900">Photos Summary</h3>
            <div className="flex items-center gap-6 text-sm text-gray-700">
              <div>Total candidate photos: <span className="font-bold">{activeSnapshot.media.totalCandidates}</span></div>
              <div>Validated: <span className="font-bold text-emerald-700">{activeSnapshot.media.validatedCount}</span></div>
              {activeSnapshot.media.rejectedCount > 0 && (
                <div>Rejected: <span className="font-bold text-rose-700">{activeSnapshot.media.rejectedCount}</span></div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Stage 5: Draft Ready Screen */}
      {stage === 'DRAFT_READY' && activeSnapshot && (
        <section aria-labelledby="draft-ready-heading" className="bg-white p-8 rounded-xl border border-emerald-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>
          <div className="space-y-2">
            <h2 id="draft-ready-heading" className="text-2xl font-bold text-gray-900">
              Ready for RENTipid Draft Creation
            </h2>
            <p className="text-sm text-gray-600 max-w-lg mx-auto">
              Your imported listing information, photos, location, and verified fields are organized and ready to become a native RENTipid draft.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl max-w-md mx-auto text-left text-sm space-y-1 text-gray-700 border border-gray-200">
            <div><span className="font-semibold">Import Job:</span> {activeSnapshot.importJobId}</div>
            <div><span className="font-semibold">Verified Fields:</span> {activeSnapshot.readiness.resolvedFieldsCount}</div>
            <div><span className="font-semibold">Media Ingested:</span> {activeSnapshot.media.validatedCount} photo(s)</div>
            <div>
              <span className="font-semibold">Status:</span>{' '}
              {createdListingId ? (
                <span className="text-emerald-700 font-bold">DRAFT_CREATED</span>
              ) : (
                'READY_FOR_DRAFT'
              )}
            </div>
            {createdListingId && (
              <div className="pt-2 text-xs text-emerald-800 font-medium">
                Draft Listing ID: <span className="font-mono">{createdListingId}</span>
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            {createdListingId ? (
              <a
                href={`/dashboard/provider/listings/${createdListingId}`}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition"
              >
                Open Draft in Listing Editor →
              </a>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStage('REVIEW_DETAILS')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back to Review
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsSubmitting(true);
                    const mockCreatedId = `lst-draft-${activeSnapshot.importJobId.slice(-6)}`;
                    setCreatedListingId(mockCreatedId);
                    setIsSubmitting(false);
                    if (onDraftCreated) {
                      onDraftCreated({
                        listingId: mockCreatedId,
                        importJobId: activeSnapshot.importJobId,
                      });
                    }
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Draft...' : 'Create RENTipid Draft'}
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {/* Inline Field Edit Modal */}
      {editingField && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              Edit {editingField.displayName}
            </h3>

            {correctionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                {correctionError}
              </div>
            )}

            <div>
              <label htmlFor="field-edit-input" className="block text-xs font-semibold text-gray-700 mb-1">
                Value
              </label>
              <textarea
                id="field-edit-input"
                rows={3}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCorrection}
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Save Correction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

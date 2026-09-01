import { ListingBridgeMediaSecurityValidator } from './media-security';
import { ListingBridgeStorageProvider, DefaultListingBridgeStorageProvider } from './media-storage';
import type { ListingBridgeSecureHttpRetrievalEngine } from '../retrieval/secure-http-retrieval';

export interface MediaCandidateInput {
  readonly sourceReferenceHash: string;
  readonly sourceUrl?: string;
  readonly buffer?: Buffer;
  readonly declaredMime?: string;
  readonly isCover?: boolean;
  readonly order?: number;
  readonly caption?: string;
}

export interface IngestedMediaAsset {
  readonly sourceReferenceHash: string;
  readonly contentSha256: string;
  readonly rentipidAssetPath: string;
  readonly publicUrl?: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly isCover: boolean;
  readonly displayOrder: number;
  readonly status: 'VALIDATED' | 'SKIPPED_DUPLICATE';
}

export interface FailedMediaAsset {
  readonly sourceReferenceHash: string;
  readonly sourceUrl?: string;
  readonly errorCode: string;
  readonly errorMessage: string;
  readonly status: 'REJECTED' | 'FAILED';
}

export interface MediaIngestionResult {
  readonly importJobId: string;
  readonly totalCandidates: number;
  readonly successfulAssets: readonly IngestedMediaAsset[];
  readonly failedAssets: readonly FailedMediaAsset[];
  readonly duplicateCount: number;
}

export interface MediaIngestionPipelineOptions {
  readonly storageProvider?: ListingBridgeStorageProvider;
  readonly retrievalEngine?: ListingBridgeSecureHttpRetrievalEngine;
}

export class ListingBridgeMediaIngestionPipeline {
  private readonly validator = new ListingBridgeMediaSecurityValidator();

  async processCandidates(
    importJobId: string,
    candidates: readonly MediaCandidateInput[],
    options: MediaIngestionPipelineOptions = {},
  ): Promise<MediaIngestionResult> {
    const storage = options.storageProvider ?? new DefaultListingBridgeStorageProvider();
    const successfulAssets: IngestedMediaAsset[] = [];
    const failedAssets: FailedMediaAsset[] = [];
    const seenContentHashes = new Map<string, IngestedMediaAsset>();
    let duplicateCount = 0;

    for (let i = 0; i < candidates.length; i++) {
      const cand = candidates[i];
      const order = cand.order ?? i + 1;
      const isCover = cand.isCover ?? i === 0;

      try {
        let buffer = cand.buffer;
        let declaredMime = cand.declaredMime;

        // If buffer not directly provided, fetch via P4 secure retrieval engine if available
        if (!buffer && cand.sourceUrl) {
          if (!options.retrievalEngine) {
            failedAssets.push({
              sourceReferenceHash: cand.sourceReferenceHash,
              sourceUrl: cand.sourceUrl,
              errorCode: 'MEDIA_RETRIEVAL_ENGINE_MISSING',
              errorMessage: 'Retrieval engine required to fetch remote media URL',
              status: 'FAILED',
            });
            continue;
          }

          const fetchResult = await options.retrievalEngine.retrieve({
            url: cand.sourceUrl,
            importJobId,
            actorUserId: 'system',
          });

          buffer = fetchResult.body;
          declaredMime = fetchResult.contentType;
        }

        if (!buffer) {
          failedAssets.push({
            sourceReferenceHash: cand.sourceReferenceHash,
            sourceUrl: cand.sourceUrl,
            errorCode: 'MEDIA_BUFFER_EMPTY',
            errorMessage: 'No media buffer or URL provided',
            status: 'FAILED',
          });
          continue;
        }

        // Validate media security & MIME
        const valResult = this.validator.validate(buffer, declaredMime);

        if (!valResult.isValid || !valResult.detectedMime) {
          failedAssets.push({
            sourceReferenceHash: cand.sourceReferenceHash,
            sourceUrl: cand.sourceUrl,
            errorCode: valResult.errorCode || 'MEDIA_VALIDATION_FAILED',
            errorMessage: valResult.errorMessage || 'Media validation failed',
            status: 'REJECTED',
          });
          continue;
        }

        // Deduplication against previously seen content hashes in this job
        const existing = seenContentHashes.get(valResult.contentSha256);
        if (existing) {
          duplicateCount++;
          const duplicateAsset: IngestedMediaAsset = {
            sourceReferenceHash: cand.sourceReferenceHash,
            contentSha256: valResult.contentSha256,
            rentipidAssetPath: existing.rentipidAssetPath,
            publicUrl: existing.publicUrl,
            mimeType: valResult.detectedMime,
            sizeBytes: valResult.sizeBytes,
            isCover,
            displayOrder: order,
            status: 'SKIPPED_DUPLICATE',
          };
          successfulAssets.push(duplicateAsset);
          continue;
        }

        // Store into RENTipid managed storage
        const fileName = `listingbridge/${importJobId}/${valResult.contentSha256}${valResult.suggestedExtension || '.jpg'}`;
        const stored = await storage.storeMedia(buffer, fileName);

        const ingestedAsset: IngestedMediaAsset = {
          sourceReferenceHash: cand.sourceReferenceHash,
          contentSha256: valResult.contentSha256,
          rentipidAssetPath: stored.path,
          publicUrl: stored.publicUrl,
          mimeType: valResult.detectedMime,
          sizeBytes: valResult.sizeBytes,
          isCover,
          displayOrder: order,
          status: 'VALIDATED',
        };

        seenContentHashes.set(valResult.contentSha256, ingestedAsset);
        successfulAssets.push(ingestedAsset);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        failedAssets.push({
          sourceReferenceHash: cand.sourceReferenceHash,
          sourceUrl: cand.sourceUrl,
          errorCode: 'MEDIA_PROCESSING_EXCEPTION',
          errorMessage: errorMsg,
          status: 'FAILED',
        });
      }
    }

    return Object.freeze({
      importJobId,
      totalCandidates: candidates.length,
      successfulAssets: Object.freeze(successfulAssets),
      failedAssets: Object.freeze(failedAssets),
      duplicateCount,
    });
  }
}

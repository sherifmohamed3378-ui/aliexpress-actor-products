import type { SourceMetadata, ExtractionMetadata } from '../../../types/common/Source.js';
import type { FoundEntry, RawDataSource } from '../../../types/discovery/DiscoveryTypes.js';

export class SourceProvenanceFactory {
  static fromFoundEntry(entry: FoundEntry, extractorId: string): SourceMetadata {
    const indexValue = typeof entry.indexInParent === 'number' ? entry.indexInParent : undefined;
    return {
      sourceType: entry.source.type,
      sourceKey: entry.key,
      path: entry.path,
      collectorId: entry.source.collectorId,
      timestamp: entry.source.timestamp,
      rawKey: entry.key,
      depth: entry.depth,
      ...(indexValue !== undefined ? { index: indexValue } : {}),
    };
  }

  static fromSource(source: RawDataSource, key: string, path: string, depth: number): SourceMetadata {
    return {
      sourceType: source.type,
      sourceKey: key,
      path,
      collectorId: source.collectorId,
      timestamp: source.timestamp,
      rawKey: key,
      depth,
    };
  }

  static createExtractionMetadata(overrides?: Partial<ExtractionMetadata>): ExtractionMetadata {
    return {
      extractionTimeMs: overrides?.extractionTimeMs ?? 0,
      traversalDepth: overrides?.traversalDepth ?? 0,
      alternativesConsidered: overrides?.alternativesConsidered ?? 0,
      normalizationApplied: overrides?.normalizationApplied ?? [],
      validationPassed: overrides?.validationPassed ?? true,
      ...(overrides?.rawValuePreview !== undefined ? { rawValuePreview: overrides.rawValuePreview } : {}),
      ...(overrides?.notes !== undefined ? { notes: overrides.notes } : {}),
    };
  }
}

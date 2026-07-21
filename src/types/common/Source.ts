import type { SourceType } from '../../constants/ConfidenceWeights.js';

export interface SourceMetadata {
  readonly sourceType: SourceType;
  readonly sourceKey: string; // The JSON key that produced the value
  readonly path: string; // Dot-notated path e.g. "data.productInfoComponent.subject"
  readonly collectorId: string;
  readonly timestamp: number;
  readonly rawKey?: string;
  readonly depth: number;
  readonly index?: number;
}

export interface ExtractionMetadata {
  readonly extractionTimeMs: number;
  readonly traversalDepth: number;
  readonly alternativesConsidered: number;
  readonly normalizationApplied: string[];
  readonly validationPassed: boolean;
  readonly rawValuePreview?: string;
  readonly notes?: string[];
}

export interface Provenance {
  readonly source: SourceMetadata;
  readonly confidence: number;
  readonly metadata: ExtractionMetadata;
}

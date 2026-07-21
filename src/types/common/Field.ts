import type { ExtractionMetadata, SourceMetadata } from './Source.js';

/**
 * Field<T> represents a single extracted value with full provenance.
 * This is the core of the confidence system - no raw values without provenance.
 */
export interface Field<T> {
  readonly value: T;
  readonly source: SourceMetadata;
  readonly confidence: number; // 0-1
  readonly sourceKey: string; // The actual JSON key
  readonly metadata: ExtractionMetadata;
  readonly alternatives?: readonly AlternativeValue<T>[];
}

export interface AlternativeValue<T> {
  readonly value: T;
  readonly confidence: number;
  readonly source: SourceMetadata;
  readonly reason?: string;
}

export type OptionalField<T> = Field<T> | null;

export function createField<T>(
  value: T,
  source: SourceMetadata,
  confidence: number,
  sourceKey: string,
  metadata: ExtractionMetadata,
  alternatives?: AlternativeValue<T>[]
): Field<T> {
  if (alternatives && alternatives.length > 0) {
    return {
      value,
      source,
      confidence,
      sourceKey,
      metadata,
      alternatives,
    };
  }
  return {
    value,
    source,
    confidence,
    sourceKey,
    metadata,
  };
}

export function isField<T>(obj: unknown): obj is Field<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'value' in obj &&
    'source' in obj &&
    'confidence' in obj &&
    'sourceKey' in obj &&
    'metadata' in obj
  );
}

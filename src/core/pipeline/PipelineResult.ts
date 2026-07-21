/**
 * PipelineResult.ts
 * Typed result wrappers for pipeline stages
 *
 * @module core/pipeline
 */

import type { Field } from '../../types/common/Field.js';
import type { DiscoveryContext } from '../../types/discovery/DiscoveryTypes.js';
import type { AliExpressProduct } from '../../types/product/Product.js';
import type { ExtractionContext } from '../extraction/ExtractionContext.js';

export interface CollectionStageOutput {
  readonly discoveryContext: DiscoveryContext;
  readonly rawSources: number;
}

export interface IndexingStageOutput {
  readonly extractionContext: ExtractionContext;
  readonly indexedSources: number;
}

export interface ExtractionStageOutput {
  readonly fields: Map<string, Field<unknown> | null>;
  readonly extractedCount: number;
}

export interface MergingStageOutput {
  readonly product: AliExpressProduct;
  readonly mergedFields: number;
  readonly averageConfidence: number;
}

export interface ValidationStageOutput {
  readonly product: AliExpressProduct;
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export type FinalPipelineOutput = ValidationStageOutput & {
  readonly product: AliExpressProduct;
  readonly performance: {
    readonly totalTimeMs: number;
    readonly collectionTimeMs: number;
    readonly indexingTimeMs: number;
    readonly extractionTimeMs: number;
    readonly mergingTimeMs: number;
    readonly validationTimeMs: number;
  };
};

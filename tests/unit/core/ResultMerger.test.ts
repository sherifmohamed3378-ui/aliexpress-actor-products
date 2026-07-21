import { describe, it, expect } from 'vitest';
import { ResultMerger } from '../../../src/core/merger/ResultMerger.js';
import type { Field } from '../../../src/types/common/Field.js';
import { SourceType } from '../../../src/constants/ConfidenceWeights.js';

function makeField<T>(id: string, value: T, confidence = 0.9): Field<T> {
  return {
    value,
    confidence,
    sourceKey: id,
    source: {
      sourceType: SourceType.WINDOW_OBJECT,
      sourceKey: id,
      path: `data.${id}`,
      collectorId: 'test',
      timestamp: Date.now(),
      depth: 1,
    },
    metadata: {
      extractionTimeMs: 10,
      traversalDepth: 1,
      alternativesConsidered: 1,
      normalizationApplied: [],
      validationPassed: true,
    },
  };
}

describe('ResultMerger', () => {
  it('merges fields into product', () => {
    const merger = new ResultMerger();
    const fields = new Map<string, Field<unknown> | null>([
      ['title', makeField('title', 'Test Product')],
      ['productId', makeField('productId', '123')],
      ['price', makeField('price', { amount: 29.99 })],
    ]);

    const product = merger.merge(fields, { preserveAlternatives: true, maxAlternatives: 3, confidenceThreshold: 0.3 });

    expect(product.title?.value).toBe('Test Product');
    expect(product.productId?.value).toBe('123');
    expect(product.price?.value).toEqual({ amount: 29.99 });
  });

  it('filters by confidence threshold', () => {
    const merger = new ResultMerger();
    const fields = new Map<string, Field<unknown> | null>([
      ['title', makeField('title', 'Low Conf', 0.1)],
      ['productId', makeField('productId', '123', 0.9)],
    ]);

    const product = merger.merge(fields, { preserveAlternatives: true, maxAlternatives: 3, confidenceThreshold: 0.5 });

    expect(product.title).toBeNull();
    expect(product.productId?.value).toBe('123');
  });
});

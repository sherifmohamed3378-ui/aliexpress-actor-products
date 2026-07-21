import { describe, it, expect } from 'vitest';
import { DeepObjectIndexer } from '../../../src/core/discovery/indexing/DeepObjectIndexer.js';
import { SourceType } from '../../../src/constants/ConfidenceWeights.js';
import type { RawDataSource } from '../../../src/types/discovery/DiscoveryTypes.js';

describe('DeepObjectIndexer', () => {
  const source: RawDataSource = {
    id: 'test',
    type: SourceType.WINDOW_OBJECT,
    data: {
      productId: '123',
      subject: 'Test',
      nested: { productId: '456', price: 10 },
    },
    url: 'https://example.com',
    timestamp: Date.now(),
    sizeBytes: 100,
    collectorId: 'test',
  };

  it('indexes source', () => {
    const indexer = new DeepObjectIndexer();
    const indexed = indexer.indexSource(source);
    expect(indexed.totalKeys).toBeGreaterThan(0);
    expect(indexed.keyIndex.size).toBeGreaterThan(0);
  });

  it('queries by signals', () => {
    const indexer = new DeepObjectIndexer();
    const indexed = indexer.indexSource(source);
    const results = indexer.queryBySignals([indexed], ['productId']);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.key.toLowerCase()).toBe('productid');
  });
});

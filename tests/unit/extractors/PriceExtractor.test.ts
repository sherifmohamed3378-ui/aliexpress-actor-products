import { describe, it, expect } from 'vitest';
import { PriceExtractor } from '../../../src/extractors/price/PriceExtractor.js';
import { SourceType } from '../../../src/constants/ConfidenceWeights.js';
import type { RawDataSource, DiscoveryContext } from '../../../src/types/discovery/DiscoveryTypes.js';
import { ExtractionContext } from '../../../src/core/extraction/ExtractionContext.js';

function makeContext(data: unknown): ExtractionContext {
  const source: RawDataSource = {
    id: 'test',
    type: SourceType.WINDOW_OBJECT,
    data,
    url: 'https://www.aliexpress.com/item/123.html',
    timestamp: Date.now(),
    sizeBytes: 100,
    collectorId: 'test',
  };
  const discovery: DiscoveryContext = {
    sources: [source],
    url: source.url ?? 'https://example.com',
    timestamp: Date.now(),
  };
  return new ExtractionContext(discovery);
}

describe('PriceExtractor', () => {
  it('extracts price from salePrice', async () => {
    const extractor = new PriceExtractor();
    const context = makeContext({ salePrice: 29.99 });
    const field = await extractor.extract(context);
    expect(field?.value.amount).toBe(29.99);
  });

  it('extracts price from string', async () => {
    const extractor = new PriceExtractor();
    const context = makeContext({ price: '$49.99' });
    const field = await extractor.extract(context);
    expect(field?.value.amount).toBe(49.99);
  });

  it('returns null for invalid price', async () => {
    const extractor = new PriceExtractor();
    const context = makeContext({ price: -5 });
    const field = await extractor.extract(context);
    expect(field).toBeNull();
  });
});

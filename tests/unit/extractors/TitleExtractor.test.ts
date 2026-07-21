import { describe, it, expect } from 'vitest';
import { TitleExtractor } from '../../../src/extractors/product/TitleExtractor.js';
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

describe('TitleExtractor', () => {
  it('extracts title from subject key', async () => {
    const extractor = new TitleExtractor();
    const context = makeContext({ subject: 'Wireless Earbuds Pro Max' });
    const field = await extractor.extract(context);
    expect(field?.value).toBe('Wireless Earbuds Pro Max');
    expect(field?.confidence).toBeGreaterThan(0.5);
  });

  it('returns null for missing title', async () => {
    const extractor = new TitleExtractor();
    const context = makeContext({ somethingElse: 'value' });
    const field = await extractor.extract(context);
    expect(field).toBeNull();
  });

  it('rejects too short title', async () => {
    const extractor = new TitleExtractor();
    const context = makeContext({ subject: 'a' });
    const field = await extractor.extract(context);
    // Validation may filter short titles via parse logic (<5 chars returns null)
    expect(field).toBeNull();
  });
});

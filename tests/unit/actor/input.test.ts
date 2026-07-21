import { describe, it, expect } from 'vitest';

import { parseActorInput } from '../../src/actor/input.js';

describe('parseActorInput', () => {
  it('applies defaults for empty input', () => {
    const input = parseActorInput(undefined);

    expect(input.startUrls.length).toBeGreaterThan(0);
    expect(input.maxItems).toBe(100);
    expect(input.confidenceThreshold).toBe(0.3);
    expect(input.includeRawData).toBe(false);
    expect(input.proxyConfiguration).toBeUndefined();
  });

  it('parses valid actor input', () => {
    const input = parseActorInput({
      startUrls: [{ url: 'https://www.aliexpress.com/item/123.html' }],
      maxItems: 5,
      confidenceThreshold: 0.5,
      includeRawData: true,
      proxyConfiguration: { useApifyProxy: true },
    });

    expect(input.startUrls).toEqual([{ url: 'https://www.aliexpress.com/item/123.html' }]);
    expect(input.maxItems).toBe(5);
    expect(input.confidenceThreshold).toBe(0.5);
    expect(input.includeRawData).toBe(true);
    expect(input.proxyConfiguration).toEqual({ useApifyProxy: true });
  });

  it('clamps maxItems and confidenceThreshold', () => {
    const input = parseActorInput({
      startUrls: [{ url: 'https://www.aliexpress.com/item/123.html' }],
      maxItems: 99999,
      confidenceThreshold: 2,
    });

    expect(input.maxItems).toBe(10000);
    expect(input.confidenceThreshold).toBe(1);
  });
});

import { describe, it, expect } from 'vitest';
import { ObjectTraverser } from '../../../src/core/discovery/traversal/ObjectTraverser.js';
import { SourceType } from '../../../src/constants/ConfidenceWeights.js';
import type { RawDataSource } from '../../../src/types/discovery/DiscoveryTypes.js';

describe('ObjectTraverser', () => {
  const source: RawDataSource = {
    id: 'test',
    type: SourceType.WINDOW_OBJECT,
    data: {},
    url: 'https://example.com',
    timestamp: Date.now(),
    sizeBytes: 0,
    collectorId: 'test',
  };

  it('finds keys by signals', () => {
    const traverser = new ObjectTraverser();
    const data = { productId: '123', nested: { subject: 'Test Product', price: 10 } };
    const entries = traverser.findByKeys(data, ['productId', 'subject'], source);
    expect(entries.length).toBe(2);
    expect(entries.some(e => e.key === 'productId')).toBe(true);
    expect(entries.some(e => e.key === 'subject')).toBe(true);
  });

  it('detects cycles', () => {
    const traverser = new ObjectTraverser();
    const obj: Record<string, unknown> = { a: 1 };
    (obj as { self: unknown }).self = obj;
    const entries = traverser.findByKeys(obj, ['a'], source);
    expect(entries.length).toBe(1);
  });

  it('respects maxDepth', () => {
    const traverser = new ObjectTraverser({ maxDepth: 1, maxKeys: 1000, detectCycles: true, includeArrays: true, includePrototype: false });
    const data = { level1: { level2: { target: 'deep' } } };
    const entries = traverser.findByKeys(data, ['target'], source);
    // target is at depth 3, should not be found with maxDepth 1
    expect(entries.length).toBe(0);
  });

  it('traverseAll builds full index', () => {
    const traverser = new ObjectTraverser();
    const data = { a: 1, b: { c: 2, d: [3, 4] } };
    const result = traverser.traverseAll(data, source);
    expect(result.totalVisited).toBeGreaterThan(0);
    expect(result.entries.length).toBeGreaterThan(0);
  });
});

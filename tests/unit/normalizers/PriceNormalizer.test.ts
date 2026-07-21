import { describe, it, expect } from 'vitest';
import { PriceNormalizer } from '../../../src/normalizers/PriceNormalizer.js';

describe('PriceNormalizer', () => {
  it('parses number', () => {
    const result = PriceNormalizer.normalize(12.34);
    expect(result?.amount).toBe(12.34);
  });

  it('parses string price', () => {
    expect(PriceNormalizer.normalize('$29.99')?.amount).toBe(29.99);
    expect(PriceNormalizer.normalize('US $59.99')?.amount).toBe(59.99);
    expect(PriceNormalizer.normalize('29.99 USD')?.amount).toBe(29.99);
  });

  it('parses thousands separator', () => {
    expect(PriceNormalizer.normalize('1,299.99')?.amount).toBe(1299.99);
  });

  it('returns null for invalid', () => {
    expect(PriceNormalizer.normalize('invalid')).toBeNull();
    expect(PriceNormalizer.normalize(null)).toBeNull();
  });

  it('parses object wrappers', () => {
    expect(PriceNormalizer.normalize({ value: 10 } as unknown)?.amount).toBe(10);
    expect(PriceNormalizer.normalize({ price: '20.5' } as unknown)?.amount).toBe(20.5);
    expect(PriceNormalizer.normalize({ cent: 1000 } as unknown)?.amount).toBe(10);
  });

  it('normalizes range string', () => {
    const range = PriceNormalizer.normalizeRange('10.00 - 20.00');
    expect(range).toEqual({ min: 10, max: 20 });
  });
});

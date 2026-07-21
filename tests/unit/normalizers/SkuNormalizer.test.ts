import { describe, it, expect } from 'vitest';
import { SkuNormalizer } from '../../../src/normalizers/SkuNormalizer.js';

describe('SkuNormalizer', () => {
  it('normalizes sku properties', () => {
    const props = SkuNormalizer.normalizeProperties([
      {
        propertyId: '14',
        propertyName: 'Color',
        values: [{ propertyValueId: '193', propertyValueName: 'Black', image: '//ae01.alicdn.com/black.jpg' }],
      },
    ] as unknown);
    expect(props?.[0]?.id).toBe('14');
    expect(props?.[0]?.name).toBe('Color');
    expect(props?.[0]?.values[0]?.name).toBe('Black');
  });

  it('normalizes sku mapping', () => {
    const mapping = SkuNormalizer.normalizeMapping({
      '14:193': { skuId: '1200001', price: 29.99, stock: 100, image: '//ae01.alicdn.com/1.jpg' },
    } as unknown);
    expect(mapping?.[0]?.skuId).toBe('1200001');
    expect(mapping?.[0]?.price).toBe(29.99);
    expect(mapping?.[0]?.stock).toBe(100);
  });

  it('returns null for invalid', () => {
    expect(SkuNormalizer.normalizeProperties(null as unknown)).toBeNull();
    expect(SkuNormalizer.normalizeMapping(null as unknown)).toBeNull();
  });
});

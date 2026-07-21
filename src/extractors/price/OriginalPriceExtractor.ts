import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { PriceNormalizer } from '../../normalizers/PriceNormalizer.js';

import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';
import type { PriceValue } from '../../types/product/Product.js';

export class OriginalPriceExtractor extends BaseExtractor<PriceValue> {
  override readonly id: string = 'originalPrice';
  override readonly signals = ['originalPrice', 'retailPrice', 'marketPrice', 'listPrice', 'origPrice', 'regularPrice'] as const;
  protected override parseEntry(entry: FoundEntry): PriceValue | null {
    const normalized = PriceNormalizer.normalize(entry.value);
    if (!normalized) return null;
    if (normalized.amount <= 0) return null;
    return normalized;
  }
}

export class SalePriceExtractor extends BaseExtractor<PriceValue> {
  override readonly id: string = 'salePrice';
  override readonly signals = ['salePrice', 'discountPrice', 'finalPrice', 'promotionPrice', 'activityPrice', 'actSkuPrice'] as const;
  protected override parseEntry(entry: FoundEntry): PriceValue | null {
    const normalized = PriceNormalizer.normalize(entry.value);
    if (!normalized) return null;
    if (normalized.amount <= 0) return null;
    return normalized;
  }
}

export class PriceRangeExtractor extends BaseExtractor<{ min: number; max: number }> {
  override readonly id: string = 'priceRange';
  override readonly signals = ['priceRange', 'minPrice', 'maxPrice', 'priceInterval'] as const;
  protected override parseEntry(entry: FoundEntry): { min: number; max: number } | null {
    // Try range parsing
    const range = PriceNormalizer.normalizeRange(entry.value);
    if (range) return range;

    // If entry value is object containing min and max
    if (entry.value && typeof entry.value === 'object') {
      const obj = entry.value as Record<string, unknown>;
      const minRaw = obj['min'] ?? obj['minPrice'] ?? obj['low'];
      const maxRaw = obj['max'] ?? obj['maxPrice'] ?? obj['high'];
      const min = PriceNormalizer.normalize(minRaw)?.amount;
      const max = PriceNormalizer.normalize(maxRaw)?.amount;
      if (min != null && max != null) return { min, max };
    }

    return null;
  }
}

import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { PriceNormalizer } from '../../normalizers/PriceNormalizer.js';

import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';
import type { PriceValue } from '../../types/product/Product.js';

export class PriceExtractor extends BaseExtractor<PriceValue> {
  override readonly id: string = 'price';
  override readonly signals = ['salePrice', 'actSkuPrice', 'price', 'currentPrice', 'productPrice', 'minPrice', 'amount'] as const;
  protected override parseEntry(entry: FoundEntry): PriceValue | null {
    const normalized = PriceNormalizer.normalize(entry.value);
    if (!normalized) return null;
    if (normalized.amount <= 0) return null;
    if (normalized.amount > 1000000) return null; // sanity
    return normalized;
  }
}

import { SIGNAL_DICTIONARY } from '../../constants/SignalKeys.js';
import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { CategoryNormalizer } from '../../normalizers/CategoryNormalizer.js';

import type { ExtractionContext } from '../../core/extraction/ExtractionContext.js';
import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';
import type { CategoryValue } from '../../types/product/Product.js';

export class CategoryExtractor extends BaseExtractor<CategoryValue> {
  override readonly id: string = 'category';
  override readonly signals = SIGNAL_DICTIONARY['category'] ?? ['category', 'categoryName'];
  protected override parseEntry(entry: FoundEntry): CategoryValue | null {
    return CategoryNormalizer.normalizeCategory(entry.value);
  }
}

export class CategoryIdsExtractor extends BaseExtractor<readonly string[]> {
  override readonly id: string = 'categoryIds';
  override readonly signals = ['categoryId', 'cateId', 'categoryIds', 'categoryID'] as const;
  protected override parseEntry(entry: FoundEntry): readonly string[] | null {
    const val = entry.value;
    if (typeof val === 'string') return [val];
    if (typeof val === 'number') return [String(val)];
    if (Array.isArray(val)) return val.map(v => String(v)).filter(Boolean);
    if (typeof val === 'object' && val !== null) {
      const obj = val as Record<string, unknown>;
      if (Array.isArray(obj['categoryIds'])) return (obj['categoryIds'] as unknown[]).map(v => String(v));
      if (obj['categoryId']) return [String(obj['categoryId'])];
    }
    return null;
  }
}

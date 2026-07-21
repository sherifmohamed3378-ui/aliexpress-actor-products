import { SIGNAL_DICTIONARY } from '../../constants/SignalKeys.js';
import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { TextNormalizer } from '../../normalizers/TextNormalizer.js';

import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';
import type { BrandValue } from '../../types/product/Product.js';

export class BrandExtractor extends BaseExtractor<BrandValue> {
  override readonly id: string = 'brand';
  override readonly signals = SIGNAL_DICTIONARY['brand'] ?? ['brand', 'brandName'];
  protected override parseEntry(entry: FoundEntry): BrandValue | null {
    const val = entry.value;
    if (typeof val === 'string') {
      const normalized = TextNormalizer.normalize(val);
      if (!normalized) return null;
      return { name: normalized };
    }
    if (typeof val === 'object' && val !== null) {
      const obj = val as Record<string, unknown>;
      const name = TextNormalizer.normalize(obj['name'] ?? obj['brandName'] ?? obj['value'] ?? val);
      if (!name) return null;
      const idRaw = obj['id'] ?? obj['brandId'];
      if (idRaw != null) {
        return { name, id: String(idRaw) };
      }
      return { name };
    }
    return null;
  }
}

export class ModelExtractor extends BaseExtractor<string> {
  override readonly id: string = 'model';
  override readonly signals = ['model', 'modelNumber', 'modelName'] as const;
  protected override parseEntry(entry: FoundEntry): string | null {
    return TextNormalizer.normalize(entry.value);
  }
}

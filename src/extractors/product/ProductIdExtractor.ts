import { SIGNAL_DICTIONARY } from '../../constants/SignalKeys.js';
import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { StringUtils } from '../../utils/StringUtils.js';

import type { ExtractionContext } from '../../core/extraction/ExtractionContext.js';
import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';

export class ProductIdExtractor extends BaseExtractor<string> {
  override readonly id: string = 'productId';
  override readonly signals = SIGNAL_DICTIONARY['productId'] ?? ['productId', 'itemId'];
  protected override parseEntry(entry: FoundEntry, context: ExtractionContext): string | null {
    // Direct value
    if (typeof entry.value === 'string' || typeof entry.value === 'number') {
      const str = String(entry.value).trim();
      if (/^\d{6,20}$/.test(str)) return str;
    }

    // From object that contains id
    if (entry.value && typeof entry.value === 'object') {
      const obj = entry.value as Record<string, unknown>;
      for (const k of ['productId', 'itemId', 'id']) {
        const v = obj[k];
        if (v != null) {
          const str = String(v).trim();
          if (/^\d{6,20}$/.test(str)) return str;
        }
      }
    }

    // Try extract from URL as fallback (via context url)
    const fromUrl = StringUtils.extractProductIdFromUrl(context.getUrl());
    if (fromUrl) return fromUrl;

    return null;
  }
  protected override validate(value: string): { isValid: boolean; notes?: string[] } {
    if (!/^\d{6,20}$/.test(value)) return { isValid: false, notes: ['invalid product id format'] };
    return { isValid: true };
  }
}

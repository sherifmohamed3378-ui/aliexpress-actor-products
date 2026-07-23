import { SIGNAL_DICTIONARY } from '../../constants/SignalKeys.js';
import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { StringUtils } from '../../utils/StringUtils.js';

import type { ExtractionContext } from '../../core/extraction/ExtractionContext.js';
import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';

export class ProductIdExtractor extends BaseExtractor<string> {
  override readonly id: string = 'productId';
  override readonly signals = SIGNAL_DICTIONARY['productId'] ?? ['productId', 'itemId', 'item', 'product'];

  protected override parseEntry(entry: FoundEntry, context?: ExtractionContext): string | null {
    // 1. Try URL extraction first (Most reliable for AliExpress)
    const currentUrl = context?.getUrl?.();
    if (currentUrl) {
      const match = currentUrl.match(/\/item\/(\d+)\.html/);
      if (match?.[1]) return match[1];

      const fromUrl = StringUtils.extractProductIdFromUrl(currentUrl);
      if (fromUrl) return fromUrl;
    }

    // 2. Direct string/number value from JSON entry
    if (typeof entry.value === 'string' || typeof entry.value === 'number') {
      const str = String(entry.value).trim();
      if (/^\d{6,20}$/.test(str)) return str;
    }

    // 3. From object containing ID properties
    if (entry.value && typeof entry.value === 'object') {
      const obj = entry.value as Record<string, unknown>;
      for (const k of ['productId', 'itemId', 'id', 'targetId']) {
        const v = obj[k];
        if (v != null) {
          const str = String(v).trim();
          if (/^\d{6,20}$/.test(str)) return str;
        }
      }
    }

    return null;
  }

  protected override validate(value: string): { isValid: boolean; notes?: string[] } {
    if (!/^\d{6,20}$/.test(value)) return { isValid: false, notes: ['invalid product id format'] };
    return { isValid: true };
  }
}
/**
 * SkuExtractor.ts
 * Extracts SKU properties, mappings, inventory, prices.
 *
 * @module extractors/sku
 */

import { SIGNAL_DICTIONARY } from '../../constants/SignalKeys.js';
import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { PriceNormalizer } from '../../normalizers/PriceNormalizer.js';
import { SkuNormalizer } from '../../normalizers/SkuNormalizer.js';
import { isObject } from '../../utils/TypeGuards.js';

import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';
import type { SkuPropertyValue, SkuMappingValue } from '../../types/product/Product.js';
import type { PriceValue } from '../../types/product/Product.js';

export class SkuPropertiesExtractor extends BaseExtractor<readonly SkuPropertyValue[]> {
  override readonly id: string = 'skuProperties';
  override readonly signals = SIGNAL_DICTIONARY['skuProperties'] ?? ['skuProperty', 'skuProperties', 'productSkuProperty'];

  protected override parseEntry(entry: FoundEntry): readonly SkuPropertyValue[] | null {
    return SkuNormalizer.normalizeProperties(entry.value);
  }
}

export class SkuMappingExtractor extends BaseExtractor<readonly SkuMappingValue[]> {
  override readonly id: string = 'skuMapping';
  override readonly signals = SIGNAL_DICTIONARY['skuMapping'] ?? ['skuMap', 'skuMapping', 'skuIdMap'];

  protected override parseEntry(entry: FoundEntry): readonly SkuMappingValue[] | null {
    return SkuNormalizer.normalizeMapping(entry.value);
  }
}

export class SkuInventoryExtractor extends BaseExtractor<Record<string, number>> {
  override readonly id: string = 'skuInventory';
  override readonly signals = ['skuInventory', 'inventoryMap', 'stockMap'] as const;

  protected override parseEntry(entry: FoundEntry): Record<string, number> | null {
    const v = entry.value;
    if (!isObject(v)) return null;
    const obj = v as Record<string, unknown>;
    const result: Record<string, number> = {};
    for (const [k, val] of Object.entries(obj)) {
      if (typeof val === 'number') result[k] = val;
      else if (typeof val === 'object' && val !== null) {
        const o = val as Record<string, unknown>;
        const stock = o['stock'] ?? o['quantity'] ?? o['availQuantity'];
        if (typeof stock === 'number') result[k] = stock;
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  }
}

export class SkuPricesExtractor extends BaseExtractor<Record<string, PriceValue>> {
  override readonly id: string = 'skuPrices';
  override readonly signals = ['skuPriceList', 'priceList', 'skuPrices'] as const;

  protected override parseEntry(entry: FoundEntry): Record<string, PriceValue> | null {
    const v = entry.value;
    if (!isObject(v)) return null;
    const obj = v as Record<string, unknown>;
    const result: Record<string, PriceValue> = {};
    for (const [k, val] of Object.entries(obj)) {
      const normalized = PriceNormalizer.normalize(val);
      if (normalized) result[k] = normalized;
    }
    return Object.keys(result).length > 0 ? result : null;
  }
}

export class SkuIdsExtractor extends BaseExtractor<readonly string[]> {
  override readonly id: string = 'skuIds';
  override readonly signals = ['skuIds', 'skuIdList', 'skuList'] as const;

  protected override parseEntry(entry: FoundEntry): readonly string[] | null {
    const v = entry.value;
    if (Array.isArray(v)) return v.map(x => String(x)).filter(Boolean);
    if (isObject(v)) {
      const o = v as Record<string, unknown>;
      if (Array.isArray(o['ids'])) return (o['ids'] as unknown[]).map(x => String(x));
    }
    return null;
  }
}

export class SkuPromotionsExtractor extends BaseExtractor<Record<string, unknown>> {
  override readonly id: string = 'skuPromotions';
  override readonly signals = ['skuPromotion', 'skuPromotions', 'skuActivity'] as const;

  protected override parseEntry(entry: FoundEntry): Record<string, unknown> | null {
    if (isObject(entry.value)) return entry.value as Record<string, unknown>;
    return null;
  }
}

import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { StockNormalizer } from '../../normalizers/HtmlNormalizer.js';

import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';

export class StockExtractor extends BaseExtractor<number> {
  override readonly id: string = 'stock';
  override readonly signals = ['stock', 'inventory', 'quantity', 'availQuantity', 'availableQuantity', 'skuStock'] as const;

  protected override parseEntry(entry: FoundEntry): number | null {
    return StockNormalizer.normalize(entry.value);
  }
}

export class InventoryExtractor extends BaseExtractor<number> {
  override readonly id: string = 'inventory';
  override readonly signals = ['stock', 'inventory', 'quantity', 'availQuantity', 'availableQuantity', 'skuStock'] as const;

  protected override parseEntry(entry: FoundEntry): number | null {
    return StockNormalizer.normalize(entry.value);
  }
}

export class AvailabilityExtractor extends BaseExtractor<boolean> {
  override readonly id: string = 'availability';
  override readonly signals = ['availability', 'inStock', 'available', 'isAvailable', 'stockStatus'] as const;

  protected override parseEntry(entry: FoundEntry): boolean | null {
    return StockNormalizer.normalizeAvailability(entry.value);
  }
}

export class WarehouseExtractor extends BaseExtractor<string> {
  override readonly id: string = 'warehouse';
  override readonly signals = ['warehouse', 'warehouseId', 'warehouseName'] as const;

  protected override parseEntry(entry: FoundEntry): string | null {
    if (typeof entry.value === 'string') return entry.value.trim() || null;
    if (typeof entry.value === 'object' && entry.value !== null) {
      const obj = entry.value as Record<string, unknown>;
      if (typeof obj['name'] === 'string') return obj['name'];
      if (typeof obj['warehouseName'] === 'string') return obj['warehouseName'];
    }
    return null;
  }
}

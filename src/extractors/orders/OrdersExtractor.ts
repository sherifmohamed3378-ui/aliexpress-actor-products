import { SIGNAL_DICTIONARY } from '../../constants/SignalKeys.js';
import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';

import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';

export class OrdersExtractor extends BaseExtractor<number> {
  override readonly id: string = 'orders';
  override readonly signals = SIGNAL_DICTIONARY['orders'] ?? ['tradeCount', 'orders', 'sales'];

  protected override parseEntry(entry: FoundEntry): number | null {
    const v = entry.value;
    if (typeof v === 'number' && v >= 0) return Math.floor(v);
    if (typeof v === 'string') {
      const cleaned = v.replace(/[^\d.]/g, '');
      // Handle "1000+ sold"
      const num = Number.parseFloat(cleaned);
      if (!Number.isNaN(num)) {
        // Handle K suffix - check original string
        if (/k/i.test(v)) return Math.floor(num * 1000);
        return Math.floor(num);
      }
    }
    if (typeof v === 'object' && v !== null) {
      const obj = v as Record<string, unknown>;
      const keys = ['tradeCount', 'count', 'orders', 'saleCount', 'totalSold'];
      for (const k of keys) {
        if (obj[k] != null) {
          const res = this.parseEntry({ ...entry, value: obj[k] } as FoundEntry);
          if (res != null) return res;
        }
      }
    }
    return null;
  }
}

export class SalesExtractor extends BaseExtractor<number> {
  override readonly id: string = 'sales';
  override readonly signals = ['sales', 'saleCount', 'soldCount', 'totalSold'] as const;

  protected override parseEntry(entry: FoundEntry): number | null {
    const v = entry.value;
    if (typeof v === 'number' && v >= 0) return Math.floor(v);
    if (typeof v === 'string') {
      const cleaned = v.replace(/[^\d.]/g, '');
      const num = Number.parseFloat(cleaned);
      if (!Number.isNaN(num)) {
        if (/k/i.test(v)) return Math.floor(num * 1000);
        return Math.floor(num);
      }
    }
    if (typeof v === 'object' && v !== null) {
      const obj = v as Record<string, unknown>;
      const keys = ['tradeCount', 'count', 'orders', 'saleCount', 'totalSold'];
      for (const k of keys) {
        if (obj[k] != null) {
          const res = this.parseEntry({ ...entry, value: obj[k] } as FoundEntry);
          if (res != null) return res;
        }
      }
    }
    return null;
  }
}

export class WishlistExtractor extends BaseExtractor<number> {
  override readonly id: string = 'wishlistCount';
  override readonly signals = SIGNAL_DICTIONARY['wishlist'] ?? ['wishCount', 'wishlistCount', 'favoriteCount'];

  protected override parseEntry(entry: FoundEntry): number | null {
    const v = entry.value;
    if (typeof v === 'number') return Math.floor(v);
    if (typeof v === 'string') {
      const num = Number.parseInt(v.replace(/[^\d]/g, ''), 10);
      return Number.isNaN(num) ? null : num;
    }
    if (typeof v === 'object' && v !== null) {
      const obj = v as Record<string, unknown>;
      for (const k of ['wishCount', 'wishlistCount', 'favoriteCount', 'count']) {
        const inner = obj[k];
        if (inner != null) {
          const res = this.parseEntry({ ...entry, value: inner } as FoundEntry);
          if (res != null) return res;
        }
      }
    }
    return null;
  }
}

export class FavoriteCountExtractor extends BaseExtractor<number> {
  override readonly id: string = 'favoriteCount';
  override readonly signals = SIGNAL_DICTIONARY['wishlist'] ?? ['wishCount', 'wishlistCount', 'favoriteCount'];

  protected override parseEntry(entry: FoundEntry): number | null {
    const v = entry.value;
    if (typeof v === 'number') return Math.floor(v);
    if (typeof v === 'string') {
      const num = Number.parseInt(v.replace(/[^\d]/g, ''), 10);
      return Number.isNaN(num) ? null : num;
    }
    if (typeof v === 'object' && v !== null) {
      const obj = v as Record<string, unknown>;
      for (const k of ['wishCount', 'wishlistCount', 'favoriteCount', 'count']) {
        const inner = obj[k];
        if (inner != null) {
          const res = this.parseEntry({ ...entry, value: inner } as FoundEntry);
          if (res != null) return res;
        }
      }
    }
    return null;
  }
}

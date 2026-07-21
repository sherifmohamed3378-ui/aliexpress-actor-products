/**
 * SellerExtractor.ts
 * Extracts seller/store information with resilient discovery.
 *
 * @module extractors/seller
 */

import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { TextNormalizer } from '../../normalizers/TextNormalizer.js';
import { isObject } from '../../utils/TypeGuards.js';

import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';
import type { SellerValue } from '../../types/product/Product.js';

function parseSellerValue(value: unknown): SellerValue | null {
  if (typeof value === 'string') {
    const name = TextNormalizer.normalize(value);
    if (!name) return null;
    return { name, id: '' };
  }
  if (isObject(value)) {
    const o = value as Record<string, unknown>;
    const name = TextNormalizer.normalize(o['storeName'] ?? o['sellerName'] ?? o['shopName'] ?? o['name'] ?? value);
    if (!name) return null;
    const id = o['storeId'] ?? o['sellerId'] ?? o['shopId'] ?? o['sellerAdminSeq'] ?? '';
    const urlRaw = o['storeUrl'];
    const levelRaw = o['level'];
    let result: SellerValue = { name, id: String(id) };
    if (typeof urlRaw === 'string') result = { ...result, url: urlRaw };
    if (typeof levelRaw === 'string') result = { ...result, level: levelRaw };
    return result;
  }
  return null;
}

export class SellerExtractor extends BaseExtractor<SellerValue> {
  override readonly id: string = 'seller';
  override readonly signals = ['seller', 'storeName', 'sellerName', 'shopName', 'store', 'sellerInfo'] as const;

  protected override parseEntry(entry: FoundEntry): SellerValue | null {
    return parseSellerValue(entry.value);
  }
}

export class StoreExtractor extends BaseExtractor<SellerValue> {
  override readonly id: string = 'store';
  override readonly signals = ['store', 'shop', 'storeInfo', 'sellerInfo'] as const;

  protected override parseEntry(entry: FoundEntry): SellerValue | null {
    return parseSellerValue(entry.value);
  }
}

export class StoreIdExtractor extends BaseExtractor<string> {
  override readonly id: string = 'storeId';
  override readonly signals = ['storeId', 'sellerId', 'shopId', 'storeNumId'] as const;

  protected override parseEntry(entry: FoundEntry): string | null {
    if (typeof entry.value === 'string' || typeof entry.value === 'number') {
      return String(entry.value);
    }
    if (isObject(entry.value)) {
      const o = entry.value as Record<string, unknown>;
      const v = o['storeId'] ?? o['sellerId'] ?? o['id'];
      if (v != null) return String(v);
    }
    return null;
  }
}

export class StoreUrlExtractor extends BaseExtractor<string> {
  override readonly id: string = 'storeUrl';
  override readonly signals = ['storeUrl', 'sellerUrl', 'shopUrl', 'storeLink'] as const;

  protected override parseEntry(entry: FoundEntry): string | null {
    if (typeof entry.value === 'string') {
      const trimmed = entry.value.trim();
      if (trimmed.includes('aliexpress') || trimmed.startsWith('/store') || trimmed.startsWith('http')) {
        return trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;
      }
      return trimmed || null;
    }
    return null;
  }
}

export class StoreLevelExtractor extends BaseExtractor<string> {
  override readonly id: string = 'storeLevel';
  override readonly signals = ['storeLevel', 'sellerLevel', 'level', 'storeRank'] as const;
  protected override parseEntry(entry: FoundEntry): string | null {
    return TextNormalizer.normalize(entry.value);
  }
}

export class FollowersExtractor extends BaseExtractor<number> {
  override readonly id: string = 'followers';
  override readonly signals = ['followers', 'fans', 'followerCount', 'followCount'] as const;
  protected override parseEntry(entry: FoundEntry): number | null {
    if (typeof entry.value === 'number') return Math.floor(entry.value);
    if (typeof entry.value === 'string') {
      const n = Number.parseInt(entry.value.replace(/[^\d]/g, ''), 10);
      return Number.isNaN(n) ? null : n;
    }
    return null;
  }
}

export class PositiveFeedbackExtractor extends BaseExtractor<number> {
  override readonly id: string = 'positiveFeedback';
  override readonly signals = ['positiveRate', 'positiveFeedback', 'feedbackRate', 'sellerPositiveRate'] as const;
  protected override parseEntry(entry: FoundEntry): number | null {
    if (typeof entry.value === 'number') {
      return entry.value > 1 ? entry.value / 100 : entry.value;
    }
    if (typeof entry.value === 'string') {
      const cleaned = entry.value.replace('%', '').trim();
      const n = Number.parseFloat(cleaned);
      if (!Number.isNaN(n)) return n > 1 ? n / 100 : n;
    }
    return null;
  }
}

import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { PriceNormalizer } from '../../normalizers/PriceNormalizer.js';
import { isObject, isArray } from '../../utils/TypeGuards.js';

import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';
import type { CouponValue } from '../../types/product/Product.js';

export class CouponExtractor extends BaseExtractor<readonly CouponValue[]> {
  override readonly id: string = 'coupons';
  override readonly signals = ['coupon', 'coupons', 'couponInfo', 'couponModule', 'storeCoupon'] as const;

  protected override parseEntry(entry: FoundEntry): readonly CouponValue[] | null {
    const val = entry.value;
    if (!val) return null;

    let arr: unknown[] = [];
    if (isArray(val)) arr = val as unknown[];
    else if (isObject(val)) {
      const obj = val as Record<string, unknown>;
      if (isArray(obj['coupons'])) arr = obj['coupons'] as unknown[];
      else if (isArray(obj['list'])) arr = obj['list'] as unknown[];
      else if (isArray(obj['couponList'])) arr = obj['couponList'] as unknown[];
      else arr = [val];
    } else return null;

    const coupons: CouponValue[] = [];

    for (const item of arr) {
      if (!isObject(item)) continue;
      const o = item as Record<string, unknown>;
      const amountRaw = o['amount'] ?? o['discount'] ?? o['value'] ?? o['couponValue'];
      const amount = PriceNormalizer.normalize(amountRaw)?.amount ?? 0;
      if (amount <= 0) continue;

      const currency = typeof o['currency'] === 'string' ? (o['currency'] as string) : 'USD';
      const condition = typeof o['condition'] === 'string' ? (o['condition'] as string) : typeof o['minOrderAmount'] === 'string' ? (o['minOrderAmount'] as string) : '';
      const discountRaw = o['discount'];

      if (typeof discountRaw === 'string') {
        coupons.push({ amount, currency, condition, discount: discountRaw });
      } else {
        coupons.push({ amount, currency, condition });
      }
    }

    return coupons.length > 0 ? coupons : null;
  }
}

export class PromotionExtractor extends BaseExtractor<readonly import('../../types/product/Product.js').PromotionValue[]> {
  override readonly id: string = 'promotions';
  override readonly signals = ['promotion', 'promotions', 'activity', 'promotionModule', 'marketingInfo'] as const;

  protected override parseEntry(entry: FoundEntry): readonly import('../../types/product/Product.js').PromotionValue[] | null {
    const val = entry.value;
    if (!val) return null;
    let arr: unknown[] = [];
    if (Array.isArray(val)) arr = val as unknown[];
    else if (isObject(val)) {
      const obj = val as Record<string, unknown>;
      if (Array.isArray(obj['promotions'])) arr = obj['promotions'] as unknown[];
      else if (Array.isArray(obj['activities'])) arr = obj['activities'] as unknown[];
      else if (Array.isArray(obj['list'])) arr = obj['list'] as unknown[];
      else arr = [val];
    }

    const promos = arr
      .map(item => {
        if (isObject(item)) {
          const o = item as Record<string, unknown>;
          const type = typeof o['type'] === 'string' ? (o['type'] as string) : typeof o['promotionType'] === 'string' ? (o['promotionType'] as string) : 'unknown';
          const desc = (o['description'] ?? o['desc'] ?? o['title'] ?? o['name'] ?? '') as string;
          const discountRaw = o['discount'];
          if (typeof discountRaw === 'string') {
            return { type, description: String(desc), discount: discountRaw };
          }
          if (discountRaw != null) {
            return { type, description: String(desc), discount: String(discountRaw) };
          }
          return { type, description: String(desc) };
        }
        if (typeof item === 'string') return { type: 'unknown', description: item };
        return null;
      })
      .filter(Boolean) as import('../../types/product/Product.js').PromotionValue[];

    return promos.length > 0 ? promos : null;
  }
}

export class FlashDealsExtractor extends BaseExtractor<readonly import('../../types/product/Product.js').PromotionValue[]> {
  override readonly id: string = 'flashDeals';
  override readonly signals = ['flashDeal', 'flashDeals', 'lightningDeal', 'superDeal'] as const;

  protected override parseEntry(entry: FoundEntry): readonly import('../../types/product/Product.js').PromotionValue[] | null {
    const val = entry.value;
    if (!val) return null;
    let arr: unknown[] = [];
    if (Array.isArray(val)) arr = val as unknown[];
    else if (isObject(val)) {
      const obj = val as Record<string, unknown>;
      if (Array.isArray(obj['promotions'])) arr = obj['promotions'] as unknown[];
      else if (Array.isArray(obj['activities'])) arr = obj['activities'] as unknown[];
      else if (Array.isArray(obj['list'])) arr = obj['list'] as unknown[];
      else arr = [val];
    }

    const promos = arr
      .map(item => {
        if (isObject(item)) {
          const o = item as Record<string, unknown>;
          const type = typeof o['type'] === 'string' ? (o['type'] as string) : typeof o['promotionType'] === 'string' ? (o['promotionType'] as string) : 'unknown';
          const desc = (o['description'] ?? o['desc'] ?? o['title'] ?? o['name'] ?? '') as string;
          const discountRaw = o['discount'];
          if (typeof discountRaw === 'string') {
            return { type, description: String(desc), discount: discountRaw };
          }
          if (discountRaw != null) {
            return { type, description: String(desc), discount: String(discountRaw) };
          }
          return { type, description: String(desc) };
        }
        if (typeof item === 'string') return { type: 'unknown', description: item };
        return null;
      })
      .filter(Boolean) as import('../../types/product/Product.js').PromotionValue[];

    return promos.length > 0 ? promos : null;
  }
}

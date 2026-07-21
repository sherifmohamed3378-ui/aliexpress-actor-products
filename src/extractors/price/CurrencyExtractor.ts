import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { TextNormalizer } from '../../normalizers/TextNormalizer.js';

import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';
import type { CurrencyValue } from '../../types/product/Product.js';

export class CurrencyExtractor extends BaseExtractor<CurrencyValue> {
  override readonly id: string = 'currency';
  override readonly signals = ['currency', 'currencyCode', 'cur', 'currencyId', 'priceCurrency'] as const;

  protected override parseEntry(entry: FoundEntry): CurrencyValue | null {
    const raw = entry.value;
    if (typeof raw === 'string') {
      const code = raw.trim().toUpperCase();
      if (/^[A-Z]{3}$/.test(code)) {
        const sym = this.symbolFromCode(code);
        return sym ? { code, symbol: sym } : { code };
      }
      if (/^[$€£¥]$/.test(code)) {
        return { code: this.codeFromSymbol(code), symbol: code };
      }
      const match = raw.match(/[A-Z]{3}/);
      if (match?.[0]) {
        const sym = this.symbolFromCode(match[0]);
        return sym ? { code: match[0], symbol: sym } : { code: match[0] as string };
      }
    }
    if (typeof raw === 'object' && raw !== null) {
      const obj = raw as Record<string, unknown>;
      const codeRaw = obj['code'] ?? obj['currencyCode'] ?? obj['currency'] ?? obj['cur'];
      if (typeof codeRaw === 'string') {
        return this.parseEntry({ ...entry, value: codeRaw } as FoundEntry);
      }
    }
    return null;
  }

  private symbolFromCode(code: string): string | undefined {
    const map: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', RUB: '₽', INR: '₹' };
    return map[code];
  }

  private codeFromSymbol(sym: string): string {
    const map: Record<string, string> = { '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'CNY' };
    return map[sym] ?? 'USD';
  }
}

export class CurrencySymbolExtractor extends BaseExtractor<string> {
  override readonly id: string = 'currencySymbol';
  override readonly signals = ['currencySymbol', 'symbol', 'priceSymbol'] as const;

  protected override parseEntry(entry: FoundEntry): string | null {
    if (typeof entry.value === 'string') {
      const v = entry.value.trim();
      if (v.length <= 3 && /[$€£¥₹₽]/.test(v)) return v;
      return TextNormalizer.normalize(v);
    }
    return null;
  }
}

export class DiscountExtractor extends BaseExtractor<number> {
  override readonly id: string = 'discount';
  override readonly signals = ['discount', 'discountRate', 'discountPercent', 'offPercent', 'priceDiscount'] as const;

  protected override parseEntry(entry: FoundEntry): number | null {
    const val = entry.value;
    if (typeof val === 'number') {
      if (val > 0 && val <= 100) return val;
      if (val > 0 && val < 1) return val * 100;
    }
    if (typeof val === 'string') {
      const cleaned = val.replace('%', '').trim();
      const num = Number.parseFloat(cleaned);
      if (!Number.isNaN(num)) {
        if (num > 0 && num <= 100) return num;
        if (num > 0 && num < 1) return num * 100;
      }
    }
    if (typeof val === 'object' && val !== null) {
      const obj = val as Record<string, unknown>;
      if (typeof obj['value'] === 'number') return this.parseEntry({ ...entry, value: obj['value'] } as FoundEntry);
      if (typeof obj['discount'] === 'number') return this.parseEntry({ ...entry, value: obj['discount'] } as FoundEntry);
      if (typeof obj['rate'] === 'number') return this.parseEntry({ ...entry, value: obj['rate'] } as FoundEntry);
    }
    return null;
  }
}

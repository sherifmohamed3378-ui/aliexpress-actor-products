import { StringUtils } from '../utils/StringUtils.js';

export class HtmlNormalizer {
  static normalize(html: unknown): string | null {
    if (typeof html !== 'string') return null;
    const trimmed = html.trim();
    if (!trimmed) return null;
    // Basic sanitation: we keep html but ensure not too large
    if (trimmed.length > 1_000_000) return trimmed.slice(0, 1_000_000);
    return trimmed;
  }

  static textFromHtml(html: unknown): string | null {
    if (typeof html !== 'string') return null;
    return StringUtils.stripHtml(html) || null;
  }
}

export class StockNormalizer {
  static normalize(value: unknown): number | null {
    if (typeof value === 'number') return Math.max(0, Math.floor(value));
    if (typeof value === 'string') {
      const n = Number.parseInt(value.replace(/[^\d]/g, ''), 10);
      return Number.isNaN(n) ? null : n;
    }
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      const keys = ['stock', 'inventory', 'quantity', 'availQuantity', 'availableQuantity'];
      for (const k of keys) {
        const v = obj[k];
        const normalized = this.normalize(v);
        if (normalized != null) return normalized;
      }
    }
    return null;
  }

  static normalizeAvailability(value: unknown): boolean | null {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (['in stock', 'available', 'true', 'yes'].some(s => lower.includes(s))) return true;
      if (['out of stock', 'unavailable', 'false', 'sold out'].some(s => lower.includes(s))) return false;
    }
    if (typeof value === 'number') return value > 0;
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      if (typeof obj['inStock'] === 'boolean') return obj['inStock'] as boolean;
      if (typeof obj['available'] === 'boolean') return obj['available'] as boolean;
      if (typeof obj['stock'] === 'number') return (obj['stock'] as number) > 0;
    }
    return null;
  }
}

export class ShippingNormalizer {
  static normalizeCompany(value: unknown): string[] | null {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) {
      return value.map(v => String(v).trim()).filter(Boolean);
    }
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      if (Array.isArray(obj['companies'])) return obj['companies'].map(v => String(v));
      if (Array.isArray(obj['list'])) return obj['list'].map(v => String(v));
    }
    return null;
  }
}

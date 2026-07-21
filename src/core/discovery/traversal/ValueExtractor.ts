import { isNonEmptyString, isNumber, isObject, isArray } from '../../../utils/TypeGuards.js';

import type { FoundEntry } from '../../../types/discovery/DiscoveryTypes.js';

export class ValueExtractor {
  static extractString(entry: FoundEntry): string | null {
    const { value } = entry;
    if (isNonEmptyString(value)) return value.trim();
    if (isNumber(value)) return String(value);
    if (isObject(value)) {
      // Try common wrappers: { value: string }, { text: string }, { displayName: string }
      const obj = value as Record<string, unknown>;
      const candidates = ['value', 'text', 'displayName', 'name', 'title', 'label', 'content'];
      for (const c of candidates) {
        const v = obj[c];
        if (isNonEmptyString(v)) return (v as string).trim();
      }
    }
    return null;
  }

  static extractNumber(entry: FoundEntry): number | null {
    const { value } = entry;
    if (isNumber(value)) return value;
    if (isNonEmptyString(value)) {
      const cleaned = (value as string).replace(/[^\d.-]/g, '');
      const num = Number(cleaned);
      return Number.isNaN(num) ? null : num;
    }
    if (isObject(value)) {
      const obj = value as Record<string, unknown>;
      const candidates = ['value', 'amount', 'price', 'count', 'number'];
      for (const c of candidates) {
        const v = obj[c];
        if (isNumber(v)) return v;
        if (isNonEmptyString(v)) {
          const num = Number((v as string).replace(/[^\d.-]/g, ''));
          if (!Number.isNaN(num)) return num;
        }
      }
    }
    return null;
  }

  static extractArray<T>(entry: FoundEntry, itemGuard?: (item: unknown) => boolean): T[] | null {
    const { value } = entry;
    if (isArray(value)) {
      if (itemGuard) {
        return (value as unknown[]).filter(itemGuard) as T[];
      }
      return value as T[];
    }
    if (isObject(value)) {
      const obj = value as Record<string, unknown>;
      // Check for list wrappers
      const listKeys = ['list', 'items', 'data', 'values', 'entries'];
      for (const lk of listKeys) {
        const lv = obj[lk];
        if (isArray(lv)) return lv as T[];
      }
    }
    return null;
  }

  static extractObject(entry: FoundEntry): Record<string, unknown> | null {
    const { value } = entry;
    if (isObject(value)) return value as Record<string, unknown>;
    return null;
  }

  static extractBoolean(entry: FoundEntry): boolean | null {
    const { value } = entry;
    if (typeof value === 'boolean') return value;
    if (isNonEmptyString(value)) {
      const lowered = value.toLowerCase();
      if (['true', 'yes', '1'].includes(lowered)) return true;
      if (['false', 'no', '0'].includes(lowered)) return false;
    }
    if (isNumber(value)) return value !== 0;
    return null;
  }
}

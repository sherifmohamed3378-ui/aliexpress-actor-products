export interface NormalizedPrice {
  readonly amount: number;
  readonly raw: string;
  readonly formatted: string;
}

export class PriceNormalizer {
  static normalize(value: unknown): { amount: number; raw?: string; formatted?: string } | null {
    if (value == null) return null;

    if (typeof value === 'number') {
      if (Number.isNaN(value)) return null;
      return { amount: value, raw: String(value), formatted: value.toFixed(2) };
    }

    if (typeof value === 'string') {
      const raw = value.trim();
      // Extract number from string like "$12.34", "US $12.34", "12.34 - 45.67"
      const match = raw.match(/[\d,.]+/);
      if (!match) return null;
      let numStr = match[0] ?? '';
      // Handle thousands separators - heuristic: if both comma and dot, assume comma thousand
      if (numStr.includes(',') && numStr.includes('.')) {
        numStr = numStr.replace(/,/g, '');
      } else if (numStr.includes(',') && !numStr.includes('.')) {
        // Could be European decimal - check if last comma has 2 digits after
        const parts = numStr.split(',');
        const last = parts[parts.length - 1] ?? '';
        if (last.length === 2) {
          numStr = numStr.replace(/,/g, '.').replace(/\.(?=.*\.)/g, '');
        } else {
          numStr = numStr.replace(/,/g, '');
        }
      }

      const amount = Number.parseFloat(numStr);
      if (Number.isNaN(amount)) return null;
      return { amount, raw, formatted: amount.toFixed(2) };
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const candidates = ['value', 'amount', 'price', 'salePrice', 'actSkuPrice', 'currentPrice', 'minPrice', 'targetPrice', 'price'];
      for (const c of candidates) {
        const v = obj[c];
        const normalized = this.normalize(v);
        if (normalized) return normalized;
      }
      // Try value object with cents?
      if ('cent' in obj && typeof obj['cent'] === 'number') {
        return { amount: (obj['cent'] as number) / 100, raw: String(obj['cent']), formatted: ((obj['cent'] as number) / 100).toFixed(2) };
      }
    }

    return null;
  }

  static normalizeRange(value: unknown): { min: number; max: number } | null {
    if (typeof value === 'string') {
      const matches = value.match(/[\d,.]+/g);
      if (!matches || matches.length < 2) return null;
      const min = this.normalize(matches[0]);
      const max = this.normalize(matches[1]);
      if (!min || !max) return null;
      return { min: min.amount, max: max.amount };
    }
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      const minCandidates = ['min', 'minPrice', 'low', 'from'];
      const maxCandidates = ['max', 'maxPrice', 'high', 'to'];

      let min: number | null = null;
      let max: number | null = null;

      for (const k of minCandidates) {
        const v = obj[k];
        const n = this.normalize(v);
        if (n) { min = n.amount; break; }
      }
      for (const k of maxCandidates) {
        const v = obj[k];
        const n = this.normalize(v);
        if (n) { max = n.amount; break; }
      }

      if (min != null && max != null) return { min, max };
    }
    return null;
  }
}

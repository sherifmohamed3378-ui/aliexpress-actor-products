export class RatingNormalizer {
  static normalizeRating(value: unknown): number | null {
    if (typeof value === 'number' && value >= 0 && value <= 5) return value;
    if (typeof value === 'string') {
      const num = Number.parseFloat(value);
      if (!Number.isNaN(num) && num >= 0 && num <= 5) return num;
      // Also handle percentage? 90% -> 4.5
      if (value.includes('%')) {
        const perc = Number.parseFloat(value.replace('%', ''));
        if (!Number.isNaN(perc)) return (perc / 100) * 5;
      }
    }
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      const candidates = ['averageStar', 'avgRating', 'rating', 'score', 'averageRating', 'productRating'];
      for (const c of candidates) {
        const v = obj[c];
        const n = this.normalizeRating(v);
        if (n != null) return n;
      }
      // Sometimes rating is 0-100
      if (typeof obj['value'] === 'number') {
        const inner = this.normalizeRating(obj['value']);
        if (inner != null) return inner;
      }
    }
    return null;
  }

  static normalizeCount(value: unknown): number | null {
    if (typeof value === 'number' && Number.isInteger(value)) return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[,]/g, '').trim();
      const num = Number.parseInt(cleaned, 10);
      if (!Number.isNaN(num)) return num;
    }
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      const candidates = ['count', 'total', 'totalValidNum', 'totalReviews', 'reviewCount', 'totalEvaluation'];
      for (const c of candidates) {
        const v = obj[c];
        const n = this.normalizeCount(v);
        if (n != null) return n;
      }
    }
    return null;
  }
}

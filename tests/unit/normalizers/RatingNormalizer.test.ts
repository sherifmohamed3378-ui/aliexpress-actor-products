import { describe, it, expect } from 'vitest';
import { RatingNormalizer } from '../../../src/normalizers/RatingNormalizer.js';

describe('RatingNormalizer', () => {
  it('normalizes rating number', () => {
    expect(RatingNormalizer.normalizeRating(4.5)).toBe(4.5);
    expect(RatingNormalizer.normalizeRating('4.8')).toBe(4.8);
  });

  it('normalizes rating from object', () => {
    expect(RatingNormalizer.normalizeRating({ averageStar: 4.7 } as unknown)).toBe(4.7);
  });

  it('normalizes percentage to 5-star', () => {
    expect(RatingNormalizer.normalizeRating('90%')).toBeCloseTo(4.5);
  });

  it('returns null for invalid rating', () => {
    expect(RatingNormalizer.normalizeRating(10)).toBeNull();
    expect(RatingNormalizer.normalizeRating('invalid')).toBeNull();
  });

  it('normalizes count', () => {
    expect(RatingNormalizer.normalizeCount(123)).toBe(123);
    expect(RatingNormalizer.normalizeCount('1,234')).toBe(1234);
    expect(RatingNormalizer.normalizeCount({ totalValidNum: 342 } as unknown)).toBe(342);
  });
});

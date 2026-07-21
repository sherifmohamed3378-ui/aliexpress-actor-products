/**
 * RatingExtractor.ts
 * Extracts rating, reviews, breakdown.
 *
 * @module extractors/rating
 */

import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { RatingNormalizer } from '../../normalizers/RatingNormalizer.js';
import { isArray, isObject } from '../../utils/TypeGuards.js';

import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';
import type { RatingBreakdownValue } from '../../types/product/Product.js';


export class ReviewCountExtractor extends BaseExtractor<number> {
  override readonly id: string = 'reviewCount';
  override readonly signals = ['totalValidNum', 'reviewCount', 'feedbackCount', 'totalEvaluation', 'totalReviews', 'evaluatedCount'] as const;

  protected override parseEntry(entry: FoundEntry): number | null {
    return RatingNormalizer.normalizeCount(entry.value);
  }
}

export class AverageRatingExtractor extends BaseExtractor<number> {
  override readonly id: string = 'averageRating';
  override readonly signals = ['averageStar', 'avgRating', 'averageRating', 'rating', 'starRating', 'score', 'productRating'] as const;

  protected override parseEntry(entry: FoundEntry): number | null {
    return RatingNormalizer.normalizeRating(entry.value);
  }
}

export class RatingBreakdownExtractor extends BaseExtractor<readonly RatingBreakdownValue[]> {
  override readonly id: string = 'ratingBreakdown';
  override readonly signals = ['ratingBreakdown', 'starBreakdown', 'ratingDistribution', 'scoreBreakdown', 'ratingSummary'] as const;

  protected override parseEntry(entry: FoundEntry): readonly RatingBreakdownValue[] | null {
    const v = entry.value;
    let arr: unknown[] = [];
    if (isArray(v)) arr = v as unknown[];
    else if (isObject(v)) {
      const o = v as Record<string, unknown>;
      if (isArray(o['breakdown'])) arr = o['breakdown'] as unknown[];
      else if (isArray(o['distribution'])) arr = o['distribution'] as unknown[];
      else if (isArray(o['list'])) arr = o['list'] as unknown[];
      else return null;
    } else return null;

    const result: RatingBreakdownValue[] = arr
      .map(item => {
        if (isObject(item)) {
          const o = item as Record<string, unknown>;
          const stars = typeof o['star'] === 'number' ? (o['star'] as number) : typeof o['stars'] === 'number' ? (o['stars'] as number) : typeof o['rating'] === 'number' ? (o['rating'] as number) : 0;
          const count = typeof o['count'] === 'number' ? (o['count'] as number) : typeof o['num'] === 'number' ? (o['num'] as number) : 0;
          const perc = typeof o['percentage'] === 'number' ? (o['percentage'] as number) : typeof o['percent'] === 'number' ? (o['percent'] as number) : 0;
          return { stars, count, percentage: perc };
        }
        return null;
      })
      .filter(Boolean) as RatingBreakdownValue[];

    return result.length > 0 ? result : null;
  }
}

export class ReviewTagsExtractor extends BaseExtractor<readonly string[]> {
  override readonly id: string = 'reviewTags';
  override readonly signals = ['reviewTags', 'tags', 'evaluationTags', 'commentTags'] as const;

  protected override parseEntry(entry: FoundEntry): readonly string[] | null {
    if (isArray(entry.value)) return (entry.value as unknown[]).map(v => String(v)).filter(Boolean);
    return null;
  }
}

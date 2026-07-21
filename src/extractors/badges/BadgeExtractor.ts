import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';

import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';
import type { BadgeValue } from '../../types/product/Product.js';

export class ChoiceBadgeExtractor extends BaseExtractor<BadgeValue> {
  override readonly id: string = 'choiceBadge';
  override readonly signals = ['choice', 'isChoice', 'choiceMark', 'choiceBadge'] as const;
  protected override parseEntry(entry: FoundEntry): BadgeValue | null {
    const v = entry.value;
    if (typeof v === 'boolean') return { type: 'choice', present: v };
    if (typeof v === 'string') {
      const lower = v.toLowerCase();
      if (lower.includes('choice')) return { type: 'choice', present: true, text: v };
    }
    if (typeof v === 'object' && v !== null) {
      const obj = v as Record<string, unknown>;
      if (obj['isChoice'] === true || obj['choice'] === true) return { type: 'choice', present: true };
      if (typeof obj['text'] === 'string' && obj['text'].toLowerCase().includes('choice')) return { type: 'choice', present: true, text: obj['text'] as string };
    }
    return null;
  }
}

export class PlusBadgeExtractor extends BaseExtractor<BadgeValue> {
  override readonly id: string = 'plusBadge';
  override readonly signals = ['plus', 'isPlus', 'plusMark', 'plusBadge'] as const;
  protected override parseEntry(entry: FoundEntry): BadgeValue | null {
    const v = entry.value;
    if (typeof v === 'boolean') return { type: 'plus', present: v };
    if (typeof v === 'string' && v.toLowerCase().includes('plus')) return { type: 'plus', present: true, text: v };
    if (typeof v === 'object' && v !== null) {
      const obj = v as Record<string, unknown>;
      if (obj['isPlus'] === true || obj['plus'] === true) return { type: 'plus', present: true };
    }
    return null;
  }
}

export class TopBrandBadgeExtractor extends BaseExtractor<BadgeValue> {
  override readonly id: string = 'topBrandBadge';
  override readonly signals = ['topBrand', 'isTopBrand', 'topBrandBadge', 'brandBadge'] as const;
  protected override parseEntry(entry: FoundEntry): BadgeValue | null {
    const v = entry.value;
    if (typeof v === 'boolean') return { type: 'topBrand', present: v };
    if (typeof v === 'string' && v.toLowerCase().includes('top')) return { type: 'topBrand', present: true, text: v };
    if (typeof v === 'object' && v !== null) {
      const obj = v as Record<string, unknown>;
      if (obj['isTopBrand'] === true || obj['topBrand'] === true) return { type: 'topBrand', present: true };
    }
    return null;
  }
}

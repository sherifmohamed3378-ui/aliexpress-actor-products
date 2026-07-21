import { SIGNAL_DICTIONARY } from '../../constants/SignalKeys.js';
import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { TextNormalizer } from '../../normalizers/TextNormalizer.js';

import type { ExtractionContext } from '../../core/extraction/ExtractionContext.js';
import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';

export class TitleExtractor extends BaseExtractor<string> {
  override readonly id: string = 'title';
  override readonly signals = SIGNAL_DICTIONARY['productTitle'] ?? ['subject', 'title', 'productTitle'];
  protected override parseEntry(entry: FoundEntry, _context: ExtractionContext): string | null {
    // Avoid picking up tiny strings or URLs
    if (typeof entry.value === 'string') {
      const v = entry.value.trim();
      if (v.length < 5) return null;
      if (v.length > 300) return null; // likely description, not title
      if (v.startsWith('http')) return null;
      return TextNormalizer.normalize(v);
    }
    // If object contains title
    const normalized = TextNormalizer.normalize(entry.value);
    if (normalized && normalized.length >= 5 && normalized.length <= 500) return normalized;
    return null;
  }
  protected override validate(value: string): { isValid: boolean; notes?: string[] } {
    if (value.length < 3) return { isValid: false, notes: ['too short'] };
    if (value.length > 500) return { isValid: false, notes: ['too long'] };
    return { isValid: true };
  }
}

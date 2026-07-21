import { SIGNAL_DICTIONARY } from '../../constants/SignalKeys.js';
import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { TextNormalizer } from '../../normalizers/TextNormalizer.js';

import type { ExtractionContext } from '../../core/extraction/ExtractionContext.js';
import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';

export class SubtitleExtractor extends BaseExtractor<string> {
  override readonly id: string = 'subtitle';
  override readonly signals = SIGNAL_DICTIONARY['productSubtitle'] ?? ['subTitle', 'subtitle'];
  protected override parseEntry(entry: FoundEntry, _context: ExtractionContext): string | null {
    const normalized = TextNormalizer.normalize(entry.value);
    if (!normalized) return null;
    if (normalized.length < 3) return null;
    if (normalized.length > 1000) return null;
    return normalized;
  }
}

import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { HtmlNormalizer } from '../../normalizers/HtmlNormalizer.js';
import { TextNormalizer } from '../../normalizers/TextNormalizer.js';

import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';

export class DescriptionExtractor extends BaseExtractor<string> {
  override readonly id: string = 'description';
  override readonly signals = ['description', 'productDescription', 'detailDesc', 'desc'] as const;
  protected override parseEntry(entry: FoundEntry): string | null {
    if (typeof entry.value === 'string') {
      const txt = entry.value.trim();
      if (txt.length < 10) return null;
      if (txt.length > 100000) return txt.slice(0, 100000);
      // If it's HTML, strip
      if (txt.includes('<') && txt.includes('>')) {
        const stripped = HtmlNormalizer.textFromHtml(txt);
        return stripped && stripped.length > 10 ? stripped : null;
      }
      return TextNormalizer.normalize(txt);
    }
    if (typeof entry.value === 'object' && entry.value !== null) {
      const obj = entry.value as Record<string, unknown>;
      const keys = ['description', 'text', 'content', 'productDescription', 'html'];
      for (const k of keys) {
        const v = obj[k];
        if (typeof v === 'string' && v.length > 10) {
          if (v.includes('<')) {
            const stripped = HtmlNormalizer.textFromHtml(v);
            if (stripped && stripped.length > 10) return stripped;
          } else {
            return TextNormalizer.normalize(v);
          }
        }
      }
    }
    return null;
  }
}

export class HtmlDescriptionExtractor extends BaseExtractor<string> {
  override readonly id: string = 'htmlDescription';
  override readonly signals = ['htmlDescription', 'descriptionUrl', 'detailDesc', 'productDetailDesc', 'description'] as const;
  protected override parseEntry(entry: FoundEntry): string | null {
    if (typeof entry.value === 'string') {
      const html = entry.value.trim();
      if (html.length < 10) return null;
      // Prefer if contains html tags
      return HtmlNormalizer.normalize(html);
    }
    return null;
  }
}

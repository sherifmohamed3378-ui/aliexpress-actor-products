import { BaseExtractor } from '../../core/extraction/BaseExtractor.js';
import { UrlNormalizer } from '../../normalizers/UrlNormalizer.js';

import type { ExtractionContext } from '../../core/extraction/ExtractionContext.js';
import type { FoundEntry } from '../../types/discovery/DiscoveryTypes.js';

export class UrlExtractor extends BaseExtractor<string> {
  override readonly id: string = 'url';
  override readonly signals = ['url', 'productUrl', 'itemUrl', 'link', 'canonicalUrl', 'og:url'] as const;
  protected override parseEntry(entry: FoundEntry, context: ExtractionContext): string | null {
    const base = context.getUrl();
    const normalized = UrlNormalizer.normalize(entry.value, base);
    if (!normalized) return null;
    if (!normalized.includes('aliexpress.com')) {
      // If current url is aliexpress, we might still want it
      if (context.getUrl().includes('aliexpress.com')) {
        // keep if url extractor gave us something? But prefer aliexpress domains
      }
    }
    return normalized;
  }
  override async extract(context: ExtractionContext): Promise<import('../../types/common/Field.js').Field<string> | null> {
    // Prefer context url as highest confidence if it's an aliexpress product url
    const url = context.getUrl();
    if (url && url.includes('aliexpress.com')) {
      const baseResult = await super.extract(context);
      if (baseResult) {
        // If discovered url equals context url, boost confidence
        return baseResult;
      }
      // If no extraction from signals but context url exists, synthesize a field
      const { SourceProvenanceFactory } = await import('../../core/extraction/Confidence/SourceProvenance.js');
      const { SourceType } = await import('../../constants/ConfidenceWeights.js');
      const source = SourceProvenanceFactory.fromSource(
        {
          id: 'context.url',
          type: SourceType.META_TAG,
          data: url,
          url,
          timestamp: Date.now(),
          sizeBytes: url.length,
          collectorId: 'context',
        },
        'url',
        'context.url',
        0
      );
      const meta = SourceProvenanceFactory.createExtractionMetadata({ validationPassed: true, traversalDepth: 0 });
      return { value: url, source, confidence: 0.9, sourceKey: 'url', metadata: meta };
    }
    return super.extract(context);
  }
}

export class CanonicalUrlExtractor extends BaseExtractor<string> {
  override readonly id: string = 'canonicalUrl';
  override readonly signals = ['canonicalUrl', 'og:url', 'canonical'] as const;
  protected override parseEntry(entry: FoundEntry, context: ExtractionContext): string | null {
    const base = context.getUrl();
    return UrlNormalizer.normalize(entry.value, base);
  }
}

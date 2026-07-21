import { SourceType } from '../../../constants/ConfidenceWeights.js';
import { META_TAG_KEYS } from '../../../constants/KnownPaths.js';
import { logger } from '../../../utils/Logger.js';

import type { ICollector, ICollectionContext } from './ICollector.js';
import type { RawDataSource } from '../../../types/discovery/DiscoveryTypes.js';

export class MetaTagCollector implements ICollector {
  readonly id = 'MetaTagCollector';
  private readonly log = logger.child(this.id);

  canCollect(context: ICollectionContext): boolean {
    return !!context.html && context.html.includes('<meta');
  }

  async collect(context: ICollectionContext): Promise<readonly RawDataSource[]> {
    if (!context.html) return [];

    const sources: RawDataSource[] = [];
    const metaData: Record<string, string> = {};

    // Extract og: and product: meta tags
    const metaRegex = /<meta[^>]*?(?:property|name)=["']([^"']+)["'][^>]*?content=["']([^"']*)["'][^>]*>/gi;
    let match: RegExpExecArray | null;
    while ((match = metaRegex.exec(context.html)) !== null) {
      const key = match[1];
      const value = match[2];
      if (!key || !value) continue;
      if (
        key.startsWith('og:') ||
        key.startsWith('product:') ||
        key.startsWith('twitter:') ||
        (META_TAG_KEYS as readonly string[]).includes(key) ||
        key.includes('title') ||
        key.includes('description') ||
        key.includes('image')
      ) {
        metaData[key] = value;
      }
    }

    // Reverse order regex for content first
    const metaRegex2 = /<meta[^>]*?content=["']([^"']*)["'][^>]*?(?:property|name)=["']([^"']+)["'][^>]*>/gi;
    while ((match = metaRegex2.exec(context.html)) !== null) {
      const value = match[1];
      const key = match[2];
      if (!key || !value) continue;
      if (!metaData[key]) {
        if (
          key.startsWith('og:') ||
          key.startsWith('product:') ||
          key.startsWith('twitter:') ||
          key.includes('title') ||
          key.includes('description')
        ) {
          metaData[key] = value;
        }
      }
    }

    if (Object.keys(metaData).length > 0) {
      sources.push({
        id: 'meta.tags',
        type: SourceType.META_TAG,
        data: metaData,
        url: context.url,
        timestamp: Date.now(),
        sizeBytes: JSON.stringify(metaData).length,
        collectorId: this.id,
      });
    }

    // Extract title tag
    const titleMatch = context.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch?.[1]) {
      sources.push({
        id: 'meta.title',
        type: SourceType.META_TAG,
        data: { title: titleMatch[1].trim() },
        url: context.url,
        timestamp: Date.now(),
        sizeBytes: titleMatch[1].length,
        collectorId: this.id,
      });
    }

    // Extract canonical
    const canonicalMatch = context.html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    if (canonicalMatch?.[1]) {
      sources.push({
        id: 'meta.canonical',
        type: SourceType.META_TAG,
        data: { canonicalUrl: canonicalMatch[1] },
        url: context.url,
        timestamp: Date.now(),
        sizeBytes: canonicalMatch[1].length,
        collectorId: this.id,
      });
    } else {
      const canonicalMatch2 = context.html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
      if (canonicalMatch2?.[1]) {
        sources.push({
          id: 'meta.canonical',
          type: SourceType.META_TAG,
          data: { canonicalUrl: canonicalMatch2[1] },
          url: context.url,
          timestamp: Date.now(),
          sizeBytes: canonicalMatch2[1].length,
          collectorId: this.id,
        });
      }
    }

    this.log.debug(`Collected ${sources.length} meta sources with ${Object.keys(metaData).length} tags`);
    return sources;
  }
}

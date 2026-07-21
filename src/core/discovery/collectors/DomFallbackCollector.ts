/**
 * DomFallbackCollector.ts
 * LAST RESORT - DOM based extraction.
 * Uses semantic heuristics, not CSS classes, to survive frontend changes.
 * Looks for data- attributes, itemprop, text patterns, etc.
 */

import { SourceType } from '../../../constants/ConfidenceWeights.js';
import { logger } from '../../../utils/Logger.js';

import type { ICollector, ICollectionContext } from './ICollector.js';
import type { RawDataSource } from '../../../types/discovery/DiscoveryTypes.js';

export class DomFallbackCollector implements ICollector {
  readonly id = 'DomFallbackCollector';
  private readonly log = logger.child(this.id);

  canCollect(_context: ICollectionContext): boolean {
    // Always can, but should be last resort
    return true;
  }

  async collect(context: ICollectionContext): Promise<readonly RawDataSource[]> {
    if (!context.html) return [];

    const sources: RawDataSource[] = [];
    const html = context.html;

    // Extract itemprop data (microdata is more stable than classes)
    const microdata: Record<string, string> = {};
    const itempropRegex = /itemprop=["']([^"']+)["'][^>]*?content=["']([^"']*)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = itempropRegex.exec(html)) !== null) {
      const key = match[1];
      const value = match[2];
      if (key && value) microdata[key] = value;
    }

    const itempropRegex2 = /itemprop=["']([^"']+)["'][^>]*>([^<]+)</gi;
    while ((match = itempropRegex2.exec(html)) !== null) {
      const key = match[1];
      const value = match[2];
      if (key && value && !microdata[key]) {
        microdata[key] = value.trim();
      }
    }

    if (Object.keys(microdata).length > 0) {
      sources.push({
        id: 'dom.microdata',
        type: SourceType.DOM_FALLBACK,
        data: microdata,
        url: context.url,
        timestamp: Date.now(),
        sizeBytes: JSON.stringify(microdata).length,
        collectorId: this.id,
      });
    }

    // Extract from semantic tags without relying on classes
    const semantic: Record<string, unknown> = {};

    // H1 is often title
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match?.[1]) {
      semantic['domTitle'] = h1Match[1].replace(/<[^>]*>/g, '').trim();
    }

    // Images with alicdn
    const imgRegex = /<img[^>]*src=["']([^"']*(?:alicdn|alibaba)[^"']*)["'][^>]*>/gi;
    const images: string[] = [];
    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];
      if (src) images.push(src.startsWith('//') ? `https:${src}` : src);
      if (images.length > 50) break;
    }
    if (images.length > 0) {
      semantic['domImages'] = images;
    }

    if (Object.keys(semantic).length > 0) {
      sources.push({
        id: 'dom.semantic',
        type: SourceType.DOM_FALLBACK,
        data: semantic,
        url: context.url,
        timestamp: Date.now(),
        sizeBytes: JSON.stringify(semantic).length,
        collectorId: this.id,
      });
    }

    this.log.debug(`Collected ${sources.length} DOM fallback sources`);
    return sources;
  }
}

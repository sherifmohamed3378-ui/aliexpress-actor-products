/**
 * WindowObjectCollector.ts
 * Collects data from window objects like runParams, _dida_config_, etc.
 * These are the most reliable sources on AliExpress.
 */

import { SourceType } from '../../../constants/ConfidenceWeights.js';
import { KNOWN_WINDOW_PATHS } from '../../../constants/KnownPaths.js';
import { logger } from '../../../utils/Logger.js';
import { SafeJsonParser } from '../../../utils/SafeJsonParser.js';

import type { ICollector, ICollectionContext } from './ICollector.js';
import type { RawDataSource } from '../../../types/discovery/DiscoveryTypes.js';

export class WindowObjectCollector implements ICollector {
  readonly id = 'WindowObjectCollector';
  private readonly log = logger.child(this.id);

  canCollect(context: ICollectionContext): boolean {
    return !!(context.windowObjects && Object.keys(context.windowObjects).length > 0);
  }

  async collect(context: ICollectionContext): Promise<readonly RawDataSource[]> {
    const sources: RawDataSource[] = [];
    const windowObjects = context.windowObjects ?? {};

    // Collect from explicitly provided window objects
    for (const [key, value] of Object.entries(windowObjects)) {
      if (value == null) continue;

      const data = typeof value === 'string' ? SafeJsonParser.parse(value) ?? value : value;

      sources.push({
        id: `window.${key}`,
        type: SourceType.WINDOW_OBJECT,
        data,
        url: context.url,
        timestamp: Date.now(),
        sizeBytes: JSON.stringify(data).length,
        collectorId: this.id,
        metadata: { windowKey: key },
      });
    }

    // Also parse HTML for window object assignments if html provided
    if (context.html) {
      const embedded = this.extractFromHtml(context.html, context.url);
      sources.push(...embedded);
    }

    this.log.debug(`Collected ${sources.length} window sources`);

    return sources;
  }

  private extractFromHtml(html: string, url: string): RawDataSource[] {
    const sources: RawDataSource[] = [];
    const patterns: readonly RegExp[] = [
      /window\.runParams\s*=\s*({[\s\S]*?});\s*(?:<\/script>|window\.)/,
      /window\._dida_config_\s*=\s*({[\s\S]*?});\s*(?:<\/script>|window\.)/,
      /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/,
      /window\.__GLOBAL_DATA__\s*=\s*({[\s\S]*?});/,
      /window\.AeStore[^=]*=\s*({[\s\S]*?});/,
      /"runParams"\s*:\s*({[\s\S]*?})\s*,\s*"/,
      /_dida_config_\s*[:=]\s*({[\s\S]*?})\s*[,;]/,
    ] as const;

    for (const pattern of patterns) {
      try {
        const matches = html.matchAll(new RegExp(pattern, 'g'));
        for (const match of matches) {
          const jsonStr = match[1];
          if (!jsonStr) continue;
          const parsed = SafeJsonParser.parse(jsonStr);
          if (parsed) {
            sources.push({
              id: `window.extracted.${pattern.source.slice(0, 20)}.${sources.length}`,
              type: SourceType.WINDOW_OBJECT,
              data: parsed,
              url,
              timestamp: Date.now(),
              sizeBytes: jsonStr.length,
              collectorId: this.id,
              metadata: { pattern: pattern.source },
            });
          }
        }
      } catch (err) {
        this.log.warn(`Pattern extraction failed`, { pattern: pattern.source, error: String(err) });
      }
    }

    // Try to extract all script tag JSON that looks like product data
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let scriptMatch: RegExpExecArray | null;
    while ((scriptMatch = scriptRegex.exec(html)) !== null) {
      const content = scriptMatch[1];
      if (!content) continue;
      if (content.length < 50) continue;
      // Only consider scripts that contain known window paths
      const containsKnown = (KNOWN_WINDOW_PATHS as readonly string[]).some(p => content.includes(p.replace('window.', '').replace('window', '')));
      if (!containsKnown && !content.includes('productId') && !content.includes('subject')) continue;

      const extracted = SafeJsonParser.tryParseEmbeddedInScript(content);
      for (const parsed of extracted) {
        if (parsed && typeof parsed === 'object') {
          const hasProductIndicators =
            JSON.stringify(parsed).includes('productId') || JSON.stringify(parsed).includes('subject');
          if (hasProductIndicators) {
            sources.push({
              id: `window.scriptTag.${sources.length}`,
              type: SourceType.EMBEDDED_JSON,
              data: parsed,
              url,
              timestamp: Date.now(),
              sizeBytes: JSON.stringify(parsed).length,
              collectorId: this.id,
              metadata: { from: 'scriptTag' },
            });
          }
        }
      }
    }

    return sources;
  }
}

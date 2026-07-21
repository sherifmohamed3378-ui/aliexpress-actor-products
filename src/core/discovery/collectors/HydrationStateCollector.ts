/**
 * HydrationStateCollector.ts
 * Collects hydration state data like __NEXT_DATA__, __NUXT__, etc.
 * Critical for Next.js / Nuxt based frontends.
 */

import { SourceType } from '../../../constants/ConfidenceWeights.js';
import { KNOWN_HYDRATION_KEYS } from '../../../constants/KnownPaths.js';
import { logger } from '../../../utils/Logger.js';
import { SafeJsonParser } from '../../../utils/SafeJsonParser.js';

import type { ICollector, ICollectionContext } from './ICollector.js';
import type { RawDataSource } from '../../../types/discovery/DiscoveryTypes.js';

export class HydrationStateCollector implements ICollector {
  readonly id = 'HydrationStateCollector';
  private readonly log = logger.child(this.id);

  canCollect(context: ICollectionContext): boolean {
    if (context.windowObjects) {
      const keys = Object.keys(context.windowObjects);
      return keys.some(k => k.includes('NEXT_DATA') || k.includes('INITIAL') || k.includes('NUXT') || k.includes('__'));
    }
    return !!context.html && (context.html.includes('__NEXT_DATA__') || context.html.includes('__NUXT__') || context.html.includes('initialData'));
  }

  async collect(context: ICollectionContext): Promise<readonly RawDataSource[]> {
    const sources: RawDataSource[] = [];

    // From windowObjects
    if (context.windowObjects) {
      for (const [key, value] of Object.entries(context.windowObjects)) {
        if (
          key.includes('NEXT_DATA') ||
          key.includes('INITIAL_STATE') ||
          key.includes('NUXT') ||
          key.includes('initialData')
        ) {
          const data = typeof value === 'string' ? SafeJsonParser.parse(value) ?? value : value;
          sources.push({
            id: `hydration.${key}`,
            type: SourceType.HYDRATION_STATE,
            data,
            url: context.url,
            timestamp: Date.now(),
            sizeBytes: JSON.stringify(data).length,
            collectorId: this.id,
            metadata: { hydrationKey: key },
          });
        }
      }
    }

    // From HTML
    if (context.html) {
      const htmlSources = this.extractHydrationFromHtml(context.html, context.url);
      sources.push(...htmlSources);
    }

    this.log.debug(`Collected ${sources.length} hydration sources`);
    return sources;
  }

  private extractHydrationFromHtml(html: string, url: string): RawDataSource[] {
    const sources: RawDataSource[] = [];

    const patterns: Array<{ regex: RegExp; type: string }> = [
      { regex: /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i, type: '__NEXT_DATA__' },
      { regex: /<script[^>]*id=["']__NUXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i, type: '__NUXT_DATA__' },
      { regex: /window\.__NEXT_DATA__\s*=\s*({[\s\S]*?});/, type: '__NEXT_DATA__' },
      { regex: /__INITIAL_STATE__\s*=\s*({[\s\S]*?});/, type: '__INITIAL_STATE__' },
    ];

    for (const { regex, type } of patterns) {
      const match = html.match(regex);
      if (match?.[1]) {
        const parsed = SafeJsonParser.parse(match[1].trim());
        if (parsed) {
          sources.push({
            id: `hydration.html.${type}.${sources.length}`,
            type: SourceType.HYDRATION_STATE,
            data: parsed,
            url,
            timestamp: Date.now(),
            sizeBytes: match[1].length,
            collectorId: this.id,
            metadata: { hydrationType: type },
          });
        }
      }
    }

    // Try to traverse into props.pageProps for Next.js
    for (const source of [...sources]) {
      try {
        if (typeof source.data === 'object' && source.data !== null) {
          const hydrated = this.resolveKnownPaths(source.data);
          if (hydrated) {
            sources.push({
              id: `${source.id}.resolved`,
              type: SourceType.HYDRATION_STATE,
              data: hydrated,
              url,
              timestamp: Date.now(),
              sizeBytes: JSON.stringify(hydrated).length,
              collectorId: this.id,
              metadata: { resolvedFrom: source.id },
            });
          }
        }
      } catch {
        // ignore
      }
    }

    return sources;
  }

  private resolveKnownPaths(data: unknown): unknown | null {
    if (!data || typeof data !== 'object') return null;

    let current: unknown = data;
    // Try known hydration keys path resolution
    for (const path of KNOWN_HYDRATION_KEYS) {
      const parts = path.split('.');
      let cursor: unknown = data;
      let found = true;
      for (const part of parts) {
        if (cursor && typeof cursor === 'object' && part in (cursor as Record<string, unknown>)) {
          cursor = (cursor as Record<string, unknown>)[part];
        } else {
          found = false;
          break;
        }
      }
      if (found && cursor) {
        current = cursor;
        break;
      }
    }

    // If current contains product indicators, return it
    const str = JSON.stringify(current);
    if (str.includes('productId') || str.includes('subject') || str.includes('salePrice')) {
      return current;
    }

    return null;
  }
}

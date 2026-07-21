import { SourceType } from '../../../constants/ConfidenceWeights.js';
import { logger } from '../../../utils/Logger.js';
import { SafeJsonParser } from '../../../utils/SafeJsonParser.js';

import type { ICollector, ICollectionContext } from './ICollector.js';
import type { RawDataSource } from '../../../types/discovery/DiscoveryTypes.js';

export class LdJsonCollector implements ICollector {
  readonly id = 'LdJsonCollector';
  private readonly log = logger.child(this.id);

  canCollect(context: ICollectionContext): boolean {
    return !!context.html && context.html.includes('application/ld+json');
  }

  async collect(context: ICollectionContext): Promise<readonly RawDataSource[]> {
    if (!context.html) return [];

    const sources: RawDataSource[] = [];
    const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

    let match: RegExpExecArray | null;
    while ((match = regex.exec(context.html)) !== null) {
      const jsonStr = match[1];
      if (!jsonStr) continue;
      const trimmed = jsonStr.trim();
      if (!trimmed) continue;

      // LD+JSON can be array or single object
      const parsed = SafeJsonParser.parse(trimmed);
      if (parsed) {
        const data = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of data) {
          if (item && typeof item === 'object') {
            sources.push({
              id: `ldjson.${sources.length}`,
              type: SourceType.LD_JSON,
              data: item,
              url: context.url,
              timestamp: Date.now(),
              sizeBytes: JSON.stringify(item).length,
              collectorId: this.id,
            });
          }
        }
      }
    }

    this.log.debug(`Collected ${sources.length} LD+JSON sources`);
    return sources;
  }
}

/**
 * NetworkResponseCollector.ts
 * Collects data from intercepted XHR / Fetch responses.
 * This is discovery via network - detecting product data in ANY JSON response.
 * Never hardcode API endpoints - detect by content.
 */

import { SourceType } from '../../../constants/ConfidenceWeights.js';
import { PRODUCT_CONTAINER_INDICATORS } from '../../../constants/SignalKeys.js';
import { logger } from '../../../utils/Logger.js';
import { SafeJsonParser } from '../../../utils/SafeJsonParser.js';
import { isObject, isArray } from '../../../utils/TypeGuards.js';

import type { ICollector, ICollectionContext } from './ICollector.js';
import type { RawDataSource } from '../../../types/discovery/DiscoveryTypes.js';

export class NetworkResponseCollector implements ICollector {
  readonly id = 'NetworkResponseCollector';
  private readonly log = logger.child(this.id);

  canCollect(context: ICollectionContext): boolean {
    return !!(context.networkResponses && context.networkResponses.length > 0);
  }

  async collect(context: ICollectionContext): Promise<readonly RawDataSource[]> {
    const responses = context.networkResponses ?? [];
    const sources: RawDataSource[] = [];

    for (const resp of responses) {
      try {
        let data: unknown = resp.body;

        if (typeof data === 'string') {
          const parsed = SafeJsonParser.parse(data as string);
          if (parsed) data = parsed;
          else continue;
        }

        if (!this.containsProductData(data)) continue;

        sources.push({
          id: `network.${this.sanitizeUrl(resp.url)}.${sources.length}`,
          type: SourceType.NETWORK_RESPONSE,
          data,
          url: resp.url,
          timestamp: Date.now(),
          sizeBytes: JSON.stringify(data).length,
          collectorId: this.id,
          metadata: { originalUrl: resp.url },
        });
      } catch (err) {
        this.log.warn(`Failed to process network response ${resp.url}`, { error: String(err) });
      }
    }

    this.log.debug(`Collected ${sources.length} network sources from ${responses.length} responses`);
    return sources;
  }

  private containsProductData(data: unknown): boolean {
    if (!data) return false;

    const str = JSON.stringify(data);
    if (str.length < 50) return false;

    // Count indicators
    let indicatorCount = 0;
    for (const indicator of PRODUCT_CONTAINER_INDICATORS) {
      if (str.includes(indicator)) indicatorCount++;
    }

    // Also check for productId numeric pattern
    const hasProductIdPattern = /"productId"\s*:\s*"?\d{8,20}"?/.test(str);
    const hasSubjectPattern = /"subject"\s*:\s*"/.test(str) || /"title"\s*:\s*"/.test(str);

    if (indicatorCount >= 2) return true;
    if (hasProductIdPattern && hasSubjectPattern) return true;
    if (indicatorCount >= 1 && (isObject(data) || isArray(data))) {
      // Check if object has product-like structure
      if (isObject(data)) {
        const keys = Object.keys(data as Record<string, unknown>);
        if (keys.some(k => k.toLowerCase().includes('product') || k.toLowerCase().includes('sku'))) {
          return true;
        }
      }
    }

    return false;
  }

  private sanitizeUrl(url: string): string {
    return url.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);
  }
}

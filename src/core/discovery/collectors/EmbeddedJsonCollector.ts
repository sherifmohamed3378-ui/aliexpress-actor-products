/**
 * EmbeddedJsonCollector.ts
 * Extracts JSON embedded in script tags and HTML attributes.
 * Second most reliable after window objects.
 */

import { SourceType } from '../../../constants/ConfidenceWeights.js';
import { logger } from '../../../utils/Logger.js';
import { SafeJsonParser } from '../../../utils/SafeJsonParser.js';

import type { ICollector, ICollectionContext } from './ICollector.js';
import type { RawDataSource } from '../../../types/discovery/DiscoveryTypes.js';

export class EmbeddedJsonCollector implements ICollector {
  readonly id = 'EmbeddedJsonCollector';
  private readonly log = logger.child(this.id);

  canCollect(context: ICollectionContext): boolean {
    return typeof context.html === 'string' && context.html.length > 0;
  }

  async collect(context: ICollectionContext): Promise<readonly RawDataSource[]> {
    if (!context.html) return [];

    const sources: RawDataSource[] = [];
    const html = context.html;

    // Strategy 1: All script tags
    const scriptRegex = /<script[^>]*?type=["']?application\/json["']?[^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;
    while ((match = scriptRegex.exec(html)) !== null) {
      const jsonStr = match[1];
      if (!jsonStr) continue;
      const parsed = SafeJsonParser.parse(jsonStr.trim());
      if (parsed) {
        sources.push({
          id: `embedded.json-ld.script.${sources.length}`,
          type: SourceType.EMBEDDED_JSON,
          data: parsed,
          url: context.url,
          timestamp: Date.now(),
          sizeBytes: jsonStr.length,
          collectorId: this.id,
        });
      }
    }

    // Strategy 2: Generic script tags with JSON-like content
    const genericScript = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    while ((match = genericScript.exec(html)) !== null) {
      const content = match[1];
      if (!content || content.length < 100) continue;

      // Heuristic: script contains product indicators
      if (!/(productId|subject|salePrice|skuProperty|imageModule)/i.test(content)) continue;

      // Try to find JSON boundaries
      const candidates = this.extractJsonCandidates(content);
      for (const candidate of candidates) {
        const parsed = SafeJsonParser.parse(candidate);
        if (parsed && typeof parsed === 'object') {
          const str = JSON.stringify(parsed);
          if (str.length < 50) continue;
          if (
            str.includes('productId') ||
            str.includes('subject') ||
            str.includes('salePrice') ||
            str.includes('sku')
          ) {
            sources.push({
              id: `embedded.generic.${sources.length}`,
              type: SourceType.EMBEDDED_JSON,
              data: parsed,
              url: context.url,
              timestamp: Date.now(),
              sizeBytes: str.length,
              collectorId: this.id,
              metadata: { heuristic: 'productIndicators' },
            });
          }
        }
        // Prevent explosion
        if (sources.length > 20) break;
      }
      if (sources.length > 20) break;
    }

    // Strategy 3: data-* attributes containing JSON
    const dataAttrRegex = /data-[a-z-]+=["']({[^"']+})["']/gi;
    while ((match = dataAttrRegex.exec(html)) !== null) {
      const jsonStr = match[1];
      if (!jsonStr) continue;
      try {
        const decoded = jsonStr.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        const parsed = SafeJsonParser.parse(decoded);
        if (parsed) {
          sources.push({
            id: `embedded.dataAttr.${sources.length}`,
            type: SourceType.EMBEDDED_JSON,
            data: parsed,
            url: context.url,
            timestamp: Date.now(),
            sizeBytes: jsonStr.length,
            collectorId: this.id,
          });
        }
      } catch {
        // ignore
      }
    }

    this.log.debug(`Collected ${sources.length} embedded JSON sources`);
    return sources;
  }

  private extractJsonCandidates(input: string): string[] {
    const candidates: string[] = [];
    const stack: number[] = [];
    let start = -1;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (char === '{') {
        if (stack.length === 0) start = i;
        stack.push(i);
      } else if (char === '}') {
        stack.pop();
        if (stack.length === 0 && start !== -1) {
          const candidate = input.substring(start, i + 1);
          if (candidate.length > 20 && candidate.length < 500000) {
            candidates.push(candidate);
          }
          start = -1;
          // Prevent too many candidates
          if (candidates.length > 10) break;
        }
      }
    }

    return candidates;
  }
}

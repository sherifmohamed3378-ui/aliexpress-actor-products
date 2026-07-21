/**
 * CompositeCollector.ts
 * Orchestrates all collectors, respects priority, merges results.
 * Implements caching and error isolation.
 */

import { logger } from '../../../utils/Logger.js';

import { DomFallbackCollector } from './DomFallbackCollector.js';
import { EmbeddedJsonCollector } from './EmbeddedJsonCollector.js';
import { HydrationStateCollector } from './HydrationStateCollector.js';
import { LdJsonCollector } from './LdJsonCollector.js';
import { MetaTagCollector } from './MetaTagCollector.js';
import { NetworkResponseCollector } from './NetworkResponseCollector.js';
import { WindowObjectCollector } from './WindowObjectCollector.js';

import type { ICollector, ICollectionContext } from './ICollector.js';
import type { RawDataSource, DiscoveryContext, PageMeta } from '../../../types/discovery/DiscoveryTypes.js';


export class CompositeCollector {
  private readonly collectors: ICollector[];
  private readonly log = logger.child('CompositeCollector');

  constructor(customCollectors?: ICollector[]) {
    this.collectors = customCollectors ?? [
      new WindowObjectCollector(),
      new HydrationStateCollector(),
      new NetworkResponseCollector(),
      new EmbeddedJsonCollector(),
      new LdJsonCollector(),
      new MetaTagCollector(),
      new DomFallbackCollector(), // Last fallback
    ];
  }

  async collect(context: ICollectionContext): Promise<DiscoveryContext> {
    const start = Date.now();
    const allSources: RawDataSource[] = [];
    const errors: string[] = [];

    // Run collectors sequentially to maintain priority order and avoid overwhelming
    // Could run in parallel but sequential gives better debugging and priority handling
    for (const collector of this.collectors) {
      try {
        if (!collector.canCollect(context)) {
          this.log.debug(`Collector ${collector.id} skipped - canCollect false`);
          continue;
        }

        const sources = await collector.collect(context);
        this.log.debug(`Collector ${collector.id} produced ${sources.length} sources`);
        allSources.push(...sources);
      } catch (err) {
        const msg = `Collector ${collector.id} failed: ${String(err)}`;
        this.log.warn(msg);
        errors.push(msg);
      }
    }

    const pageMeta: PageMeta = context.headers
      ? { url: context.url, headers: context.headers }
      : { url: context.url };

    const discoveryContext: DiscoveryContext = {
      sources: allSources,
      ...(context.html !== undefined ? { html: context.html } : {}),
      url: context.url,
      timestamp: Date.now(),
      pageMeta,
    };

    this.log.info(`Collection complete`, {
      totalSources: allSources.length,
      collectorsRun: this.collectors.length,
      errors: errors.length,
      durationMs: Date.now() - start,
    });

    return discoveryContext;
  }

  getCollectorIds(): readonly string[] {
    return this.collectors.map(c => c.id);
  }
}

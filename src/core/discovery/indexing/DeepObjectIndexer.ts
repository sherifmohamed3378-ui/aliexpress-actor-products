/**
 * DeepObjectIndexer.ts
 * Builds efficient indexes for fast lookups, avoiding repeated recursive searches.
 * Performance: O(N) to build, O(1) to query.
 */

import { logger } from '../../../utils/Logger.js';
import { ObjectTraverser } from '../traversal/ObjectTraverser.js';
import { DEFAULT_TRAVERSAL_OPTIONS } from '../traversal/TraversalOptions.js';

import type { RawDataSource, IndexedSource, FoundEntry } from '../../../types/discovery/DiscoveryTypes.js';
import type { TraversalOptions } from '../traversal/TraversalOptions.js';


export class DeepObjectIndexer {
  private readonly traverser: ObjectTraverser;

  constructor(options: Partial<TraversalOptions> = {}) {
    this.traverser = new ObjectTraverser({ ...DEFAULT_TRAVERSAL_OPTIONS, ...options });
  }

  indexSource(source: RawDataSource): IndexedSource {
    const start = Date.now();
    const log = logger.child('DeepObjectIndexer');

    try {
      const traversal = this.traverser.traverseAll(source.data, source);

      const keyIndex = new Map<string, FoundEntry[]>();
      const pathIndex = new Map<string, FoundEntry>();

      for (const entry of traversal.entries) {
        const lowerKey = entry.key.toLowerCase();

        const existing = keyIndex.get(lowerKey);
        if (existing) {
          existing.push(entry);
        } else {
          keyIndex.set(lowerKey, [entry]);
        }

        pathIndex.set(entry.path, entry);
      }

      log.debug(`Indexed source ${source.id}`, {
        totalKeys: traversal.totalVisited,
        indexedKeys: keyIndex.size,
        paths: pathIndex.size,
        truncated: traversal.truncated,
        durationMs: Date.now() - start,
      });

      return {
        source,
        keyIndex,
        pathIndex,
        totalKeys: traversal.totalVisited,
      };
    } catch (err) {
      log.error(`Failed to index source ${source.id}`, { error: String(err) });
      return {
        source,
        keyIndex: new Map(),
        pathIndex: new Map(),
        totalKeys: 0,
      };
    }
  }

  indexSources(sources: readonly RawDataSource[]): IndexedSource[] {
    return sources.map(s => this.indexSource(s));
  }

  /**
   * Query indexed sources for entries matching signals.
   * Much faster than direct traversal after indexing.
   */
  queryBySignals(indexed: readonly IndexedSource[], signals: readonly string[]): FoundEntry[] {
    const results: FoundEntry[] = [];
    const lowerSignals = signals.map(s => s.toLowerCase());

    for (const idxSource of indexed) {
      for (const sig of lowerSignals) {
        const entries = idxSource.keyIndex.get(sig);
        if (entries) {
          results.push(...entries);
        } else {
          // Partial match fallback: check if any indexed key contains signal
          for (const [key, ents] of idxSource.keyIndex.entries()) {
            if (key.includes(sig) || sig.includes(key)) {
              results.push(...ents);
            }
          }
        }
      }
    }

    // Sort by depth (shallower first - more likely to be top-level product data)
    return results.sort((a, b) => a.depth - b.depth);
  }

  clearCache(): void {
    this.traverser.clearCache();
  }
}

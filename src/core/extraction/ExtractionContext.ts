import { NoOpLogger } from '../../utils/Logger.js';
import { DeepObjectIndexer } from '../discovery/indexing/DeepObjectIndexer.js';
import { KeyFrequencyIndex } from '../discovery/indexing/KeyFrequencyIndex.js';
import { ObjectTraverser } from '../discovery/traversal/ObjectTraverser.js';

import type { DiscoveryContext, FoundEntry, IndexedSource } from '../../types/discovery/DiscoveryTypes.js';
import type { ILogger } from '../../utils/Logger.js';


export class ExtractionContext {
  readonly discovery: DiscoveryContext;
  readonly indexedSources: readonly IndexedSource[];
  readonly traverser: ObjectTraverser;
  readonly frequencyIndex: KeyFrequencyIndex;
  readonly logger: ILogger;
  private readonly allEntriesCache = new Map<string, FoundEntry[]>();

  constructor(discovery: DiscoveryContext, logger?: ILogger) {
    this.discovery = discovery;
    this.logger = logger ?? new NoOpLogger();
    this.traverser = new ObjectTraverser();

    const indexer = new DeepObjectIndexer();
    this.indexedSources = indexer.indexSources(discovery.sources);
    this.frequencyIndex = new KeyFrequencyIndex();
    this.frequencyIndex.build(this.indexedSources);
  }

  findBySignals(signals: readonly string[]): FoundEntry[] {
    const cacheKey = signals.join('|').toLowerCase();
    const cached = this.allEntriesCache.get(cacheKey);
    if (cached) return cached;

    const fromIndexer = new DeepObjectIndexer().queryBySignals(this.indexedSources, signals);

    // If no results from indexer, fallback to live traversal for thoroughness
    let results = fromIndexer;
    if (results.length === 0) {
      for (const source of this.discovery.sources) {
        const found = this.traverser.findByKeys(source.data, signals, source);
        results = results.concat(found);
      }
    }

    // Deduplicate by path+value
    const deduped = this.deduplicate(results);
    this.allEntriesCache.set(cacheKey, deduped);
    return deduped;
  }

  findByPredicate(predicate: (value: unknown, key: string, path: string) => boolean): FoundEntry[] {
    const results: FoundEntry[] = [];
    for (const source of this.discovery.sources) {
      const found = this.traverser.findByPredicate(source.data, predicate, source);
      results.push(...found);
    }
    return this.deduplicate(results);
  }

  private deduplicate(entries: readonly FoundEntry[]): FoundEntry[] {
    const seen = new Set<string>();
    const result: FoundEntry[] = [];
    for (const e of entries) {
      const key = `${e.source.id}:${e.path}:${String(e.value).slice(0, 100)}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(e);
      }
    }
    return result;
  }

  getHtml(): string | undefined {
    return this.discovery.html;
  }

  getUrl(): string {
    return this.discovery.url;
  }
}

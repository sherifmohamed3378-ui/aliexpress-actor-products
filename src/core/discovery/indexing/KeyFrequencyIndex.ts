/**
 * KeyFrequencyIndex.ts
 * Tracks how often keys appear across all sources - helps identify most relevant data.
 */

import type { IndexedSource, FoundEntry } from '../../../types/discovery/DiscoveryTypes.js';

export interface KeyFrequency {
  readonly key: string;
  readonly count: number;
  readonly sources: readonly string[];
  readonly entries: readonly FoundEntry[];
}

export class KeyFrequencyIndex {
  private readonly frequency = new Map<string, { count: number; sources: Set<string>; entries: FoundEntry[] }>();

  build(indexedSources: readonly IndexedSource[]): Map<string, KeyFrequency> {
    this.frequency.clear();

    for (const indexed of indexedSources) {
      for (const [key, entries] of indexed.keyIndex.entries()) {
        const existing = this.frequency.get(key);
        if (existing) {
          existing.count += entries.length;
          existing.sources.add(indexed.source.id);
          existing.entries.push(...entries);
        } else {
          this.frequency.set(key, {
            count: entries.length,
            sources: new Set([indexed.source.id]),
            entries: [...entries],
          });
        }
      }
    }

    const result = new Map<string, KeyFrequency>();
    for (const [key, data] of this.frequency.entries()) {
      result.set(key, {
        key,
        count: data.count,
        sources: Array.from(data.sources),
        entries: data.entries,
      });
    }

    return result;
  }

  getMostFrequent(limit = 20): KeyFrequency[] {
    const all = Array.from(this.frequency.entries())
      .map(([key, data]) => ({
        key,
        count: data.count,
        sources: Array.from(data.sources),
        entries: data.entries as readonly FoundEntry[],
      }))
      .sort((a, b) => b.count - a.count);

    return all.slice(0, limit);
  }

  findCandidates(signals: readonly string[]): KeyFrequency[] {
    const lowerSignals = new Set(signals.map(s => s.toLowerCase()));
    const matches: KeyFrequency[] = [];

    for (const [key, data] of this.frequency.entries()) {
      const lowerKey = key.toLowerCase();
      if (lowerSignals.has(lowerKey)) {
        matches.push({
          key,
          count: data.count,
          sources: Array.from(data.sources),
          entries: data.entries,
        });
      }
    }

    // Also check partial matches
    if (matches.length === 0) {
      for (const [key, data] of this.frequency.entries()) {
        const lowerKey = key.toLowerCase();
        for (const sig of lowerSignals) {
          if (lowerKey.includes(sig) || sig.includes(lowerKey)) {
            matches.push({
              key,
              count: data.count,
              sources: Array.from(data.sources),
              entries: data.entries,
            });
            break;
          }
        }
      }
    }

    return matches.sort((a, b) => b.count - a.count);
  }
}

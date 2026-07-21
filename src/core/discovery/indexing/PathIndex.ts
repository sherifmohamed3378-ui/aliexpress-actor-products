import type { FoundEntry } from '../../../types/discovery/DiscoveryTypes.js';

export class PathIndex {
  private readonly index = new Map<string, FoundEntry>();
  private readonly depthIndex = new Map<number, FoundEntry[]>();

  add(entry: FoundEntry): void {
    this.index.set(entry.path, entry);
    const existing = this.depthIndex.get(entry.depth);
    if (existing) {
      existing.push(entry);
    } else {
      this.depthIndex.set(entry.depth, [entry]);
    }
  }

  addMany(entries: readonly FoundEntry[]): void {
    for (const e of entries) this.add(e);
  }

  getByPath(path: string): FoundEntry | undefined {
    return this.index.get(path);
  }

  getByDepth(depth: number): readonly FoundEntry[] {
    return this.depthIndex.get(depth) ?? [];
  }

  getShallowest(): FoundEntry | undefined {
    const depths = Array.from(this.depthIndex.keys()).sort((a, b) => a - b);
    for (const d of depths) {
      const entries = this.depthIndex.get(d);
      if (entries && entries.length > 0) return entries[0];
    }
    return undefined;
  }

  search(predicate: (entry: FoundEntry) => boolean): FoundEntry[] {
    const results: FoundEntry[] = [];
    for (const entry of this.index.values()) {
      if (predicate(entry)) results.push(entry);
    }
    return results;
  }

  size(): number {
    return this.index.size;
  }

  clear(): void {
    this.index.clear();
    this.depthIndex.clear();
  }
}

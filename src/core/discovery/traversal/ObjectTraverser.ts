/**
 * ObjectTraverser.ts
 * Enterprise-grade deep object traversal with cycle detection, performance optimization, indexing.
 * This is the workhorse of recursive object discovery - designed to survive AE changes.
 */

import { Cache } from '../../../utils/Cache.js';

import { CycleDetector } from './CycleDetector.js';
import { PathMatcher } from './PathMatcher.js';
import { DEFAULT_TRAVERSAL_OPTIONS, type SearchOptions, type TraversalOptions } from './TraversalOptions.js';

import type { FoundEntry } from '../../../types/discovery/DiscoveryTypes.js';
import type { RawDataSource } from '../../../types/discovery/DiscoveryTypes.js';

export interface TraversalResult {
  readonly entries: readonly FoundEntry[];
  readonly totalVisited: number;
  readonly maxDepthReached: number;
  readonly cyclesDetected: number;
  readonly truncated: boolean;
}

export class ObjectTraverser {
  private readonly cache = new Cache<string, FoundEntry[]>(500, 30000);

  constructor(private readonly options: TraversalOptions = DEFAULT_TRAVERSAL_OPTIONS) {}

  /**
   * Finds all entries whose key matches any of the provided signals.
   * This is the primary method for resilient discovery - never hardcode paths.
   */
  findByKeys(
    root: unknown,
    signals: readonly string[],
    source: RawDataSource,
    searchOptions?: Partial<SearchOptions>
  ): FoundEntry[] {
    const cacheKey = `${source.id}:${signals.join(',')}:${JSON.stringify(searchOptions)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const opts: SearchOptions = {
      ...DEFAULT_TRAVERSAL_OPTIONS,
      caseSensitive: false,
      exactMatch: true,
      includeNull: false,
      ...this.options,
      ...searchOptions,
    };

    const result: FoundEntry[] = [];
    const cycleDetector = new CycleDetector();
    let visited = 0;
    let maxDepth = 0;
    let cycles = 0;
    let truncated = false;

    const stack: Array<{ value: unknown; path: string; depth: number; parent?: unknown }> = [
      { value: root, path: '', depth: 0 },
    ];

    const signalSet = new Set(opts.caseSensitive ? signals : signals.map(s => s.toLowerCase()));

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) break;

      const { value, path, depth, parent } = current;

      visited++;
      if (depth > maxDepth) maxDepth = depth;

      if (visited > opts.maxKeys) {
        truncated = true;
        break;
      }

      if (depth > opts.maxDepth) continue;

      if (opts.detectCycles && typeof value === 'object' && value !== null) {
        if (!cycleDetector.enter(value as object)) {
          cycles++;
          continue;
        }
      }

      if (value !== null && typeof value === 'object') {
        const isArray = Array.isArray(value);

        if (isArray) {
          if (opts.includeArrays) {
            for (let i = (value as unknown[]).length - 1; i >= 0; i--) {
              const childPath = PathMatcher.buildPath(path, i);
              const childValue = (value as unknown[])[i];
              // Check if array element key? No, but check array itself already.
              stack.push({ value: childValue, path: childPath, depth: depth + 1, parent: value });
            }
          }
        } else {
          const obj = value as Record<string, unknown>;
          const keys = Object.keys(obj);
          // Iterate reverse for stack LIFO to preserve order
          for (let j = keys.length - 1; j >= 0; j--) {
            const k = keys[j] as string;
            if (!k) continue;

            const childPath = PathMatcher.buildPath(path, k);
            const childValue = obj[k];

            const keyToCheck = opts.caseSensitive ? k : k.toLowerCase();

            if (signalSet.has(keyToCheck)) {
              result.push({
                key: k,
                value: childValue,
                path: childPath,
                depth: depth + 1,
                source,
                parent,
              });
            } else if (!opts.exactMatch) {
              // Partial matching - check if any signal is contained in key or vice versa
              for (const sig of signalSet) {
                if (keyToCheck.includes(sig) || sig.includes(keyToCheck)) {
                  result.push({
                    key: k,
                    value: childValue,
                    path: childPath,
                    depth: depth + 1,
                    source,
                    parent,
                  });
                  break;
                }
              }
            }

            // Continue traversal if not null (configurable)
            if (childValue !== null || opts.includeNull) {
              stack.push({ value: childValue, path: childPath, depth: depth + 1, parent: value });
            }
          }
        }

        if (opts.detectCycles && typeof value === 'object' && value !== null) {
          cycleDetector.leave(value as object);
        }
      }

      if (opts.earlyExit?.(path, depth, visited)) {
        truncated = true;
        break;
      }
    }

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Finds entries where value matches predicate.
   */
  findByPredicate(
    root: unknown,
    predicate: (value: unknown, key: string, path: string) => boolean,
    source: RawDataSource,
    options?: Partial<TraversalOptions>
  ): FoundEntry[] {
    const opts = { ...DEFAULT_TRAVERSAL_OPTIONS, ...this.options, ...options };
    const result: FoundEntry[] = [];
    const cycleDetector = new CycleDetector();
    let visited = 0;
    const stack: Array<{ value: unknown; path: string; depth: number }> = [
      { value: root, path: '', depth: 0 },
    ];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) break;
      const { value, path, depth } = current;
      visited++;
      if (visited > opts.maxKeys || depth > opts.maxDepth) continue;

      if (typeof value === 'object' && value !== null) {
        if (opts.detectCycles && !cycleDetector.enter(value as object)) continue;

        if (Array.isArray(value)) {
          if (opts.includeArrays) {
            for (let i = value.length - 1; i >= 0; i--) {
              const childPath = PathMatcher.buildPath(path, i);
              const child = (value as unknown[])[i];
              const key = String(i);
              if (predicate(child, key, childPath)) {
                result.push({ key, value: child, path: childPath, depth: depth + 1, source });
              }
              stack.push({ value: child, path: childPath, depth: depth + 1 });
            }
          }
        } else {
          const obj = value as Record<string, unknown>;
          for (const k of Object.keys(obj)) {
            const childPath = PathMatcher.buildPath(path, k);
            const child = obj[k];
            if (predicate(child, k, childPath)) {
              result.push({ key: k, value: child, path: childPath, depth: depth + 1, source });
            }
            stack.push({ value: child, path: childPath, depth: depth + 1 });
          }
        }

        if (opts.detectCycles) cycleDetector.leave(value as object);
      }
    }

    return result;
  }

  /**
   * Traverses entire object and returns all entries (for indexing).
   */
  traverseAll(root: unknown, source: RawDataSource, options?: Partial<TraversalOptions>): TraversalResult {
    const opts = { ...DEFAULT_TRAVERSAL_OPTIONS, ...this.options, ...options };
    const entries: FoundEntry[] = [];
    const cycleDetector = new CycleDetector();
    let visited = 0;
    let maxDepthReached = 0;
    let cyclesDetected = 0;
    let truncated = false;

    const stack: Array<{ value: unknown; path: string; depth: number; parent?: unknown; indexInParent?: string | number }> = [
      { value: root, path: '', depth: 0 },
    ];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) break;
      const { value, path, depth, parent, indexInParent } = current;
      visited++;
      if (depth > maxDepthReached) maxDepthReached = depth;

      if (visited > opts.maxKeys) {
        truncated = true;
        break;
      }
      if (depth > opts.maxDepth) continue;

      if (typeof value === 'object' && value !== null) {
        if (opts.detectCycles) {
          if (!cycleDetector.enter(value as object)) {
            cyclesDetected++;
            continue;
          }
        }

        if (Array.isArray(value)) {
          if (opts.includeArrays) {
            for (let i = value.length - 1; i >= 0; i--) {
              const childPath = PathMatcher.buildPath(path, i);
              const child = (value as unknown[])[i];
              entries.push({
                key: String(i),
                value: child,
                path: childPath,
                depth: depth + 1,
                source,
                parent: value,
                indexInParent: i,
              });
              stack.push({ value: child, path: childPath, depth: depth + 1, parent: value, indexInParent: i });
            }
          }
        } else {
          const obj = value as Record<string, unknown>;
          const keys = Object.keys(obj);
          for (let j = keys.length - 1; j >= 0; j--) {
            const k = keys[j] as string;
            const childPath = PathMatcher.buildPath(path, k);
            const child = obj[k];
            entries.push({
              key: k,
              value: child,
              path: childPath,
              depth: depth + 1,
              source,
              parent: value,
              indexInParent: k,
            });
            if (child !== null || opts.includeNull) {
              stack.push({ value: child, path: childPath, depth: depth + 1, parent: value, indexInParent: k });
            }
          }
        }

        if (opts.detectCycles) cycleDetector.leave(value as object);
      }
    }

    return {
      entries,
      totalVisited: visited,
      maxDepthReached,
      cyclesDetected,
      truncated,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

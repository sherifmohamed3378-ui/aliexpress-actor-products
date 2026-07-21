import type { SourceType } from '../../constants/ConfidenceWeights.js';

export interface RawDataSource {
  readonly id: string;
  readonly type: SourceType;
  readonly data: unknown;
  readonly url?: string;
  readonly timestamp: number;
  readonly sizeBytes: number;
  readonly collectorId: string;
  readonly metadata?: Record<string, unknown>;
}

export interface DiscoveryContext {
  readonly sources: readonly RawDataSource[];
  readonly html?: string;
  readonly url: string;
  readonly timestamp: number;
  readonly pageMeta?: PageMeta;
}

export interface PageMeta {
  readonly title?: string;
  readonly url: string;
  readonly canonicalUrl?: string;
  readonly headers?: Record<string, string>;
}

export interface FoundEntry {
  readonly key: string;
  readonly value: unknown;
  readonly path: string;
  readonly depth: number;
  readonly source: RawDataSource;
  readonly parent?: unknown;
  readonly indexInParent?: number | string;
}

export interface IndexedSource {
  readonly source: RawDataSource;
  readonly keyIndex: Map<string, FoundEntry[]>;
  readonly pathIndex: Map<string, FoundEntry>;
  readonly valueIndex?: Map<string, FoundEntry[]>;
  readonly totalKeys: number;
}

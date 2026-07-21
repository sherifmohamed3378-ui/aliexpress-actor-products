import type { DiscoveryContext } from '../discovery/DiscoveryTypes.js';
import type { AliExpressProduct } from '../product/Product.js';

export interface EngineConfig {
  readonly confidenceThreshold: number;
  readonly includeRawData: boolean;
  readonly maxTraversalDepth: number;
  readonly maxKeysPerSource: number;
  readonly enableDomFallback: boolean;
  readonly enableNetworkDiscovery: boolean;
  readonly timeoutMs: number;
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  confidenceThreshold: 0.3,
  includeRawData: false,
  maxTraversalDepth: 25,
  maxKeysPerSource: 50000,
  enableDomFallback: true,
  enableNetworkDiscovery: true,
  timeoutMs: 30000,
} as const;

export interface EngineResult {
  readonly product: AliExpressProduct;
  readonly discoveryContext: DiscoveryContext;
  readonly errors: readonly EngineError[];
  readonly warnings: readonly string[];
  readonly performance: EnginePerformance;
}

export interface EngineError {
  readonly code: string;
  readonly message: string;
  readonly extractorId?: string;
  readonly sourceId?: string;
  readonly stack?: string;
}

export interface EnginePerformance {
  readonly totalTimeMs: number;
  readonly collectionTimeMs: number;
  readonly indexingTimeMs: number;
  readonly extractionTimeMs: number;
  readonly normalizationTimeMs: number;
  readonly validationTimeMs: number;
  readonly sourcesProcessed: number;
  readonly fieldsExtracted: number;
}

export interface ExtractionRequest {
  readonly url: string;
  readonly html?: string;
  readonly windowObjects?: Record<string, unknown>;
  readonly networkResponses?: readonly { url: string; body: unknown }[];
  readonly config?: Partial<EngineConfig>;
}

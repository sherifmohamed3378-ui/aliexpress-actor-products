/**
 * EngineConfig.ts
 * Enterprise-grade configuration layer for the AliExpress extraction engine.
 * Supports pluggable extractors, performance tuning, debug modes, and future extensions.
 *
 * @module core/config
 */

/**
 * Logging verbosity levels
 */
export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

/**
 * Performance mode affects traversal depth and limits
 */
export type PerformanceMode = 'fast' | 'balanced' | 'thorough';

/**
 * Core engine configuration
 */
export interface EngineConfig {
  /** Minimum confidence (0-1) for fields to be included */
  readonly confidenceThreshold: number;

  /** Whether to include raw discovery data in result for debugging */
  readonly includeRawData: boolean;

  /** Maximum depth for recursive object traversal */
  readonly maxTraversalDepth: number;

  /** Maximum number of keys to visit per source */
  readonly maxKeysPerSource: number;

  /** Whether to enable DOM fallback (least reliable) */
  readonly enableDomFallback: boolean;

  /** Whether to enable network response discovery */
  readonly enableNetworkDiscovery: boolean;

  /** Global timeout for extraction pipeline in ms */
  readonly timeoutMs: number;

  /** Logging level */
  readonly logLevel: LogLevel;

  /** Performance mode */
  readonly performanceMode: PerformanceMode;

  /** Strict mode - fail fast on validation errors */
  readonly strictMode: boolean;

  /** Debug mode - extra logging and metadata */
  readonly debugMode: boolean;

  /** Cache enabled */
  readonly cacheEnabled: boolean;

  /** Custom extractor ids to disable */
  readonly disabledExtractors: readonly string[];

  /** Custom extractor ids to enable exclusively (if set, only these run) */
  readonly enabledExtractors?: readonly string[];

  /** Whether to preserve alternative values */
  readonly preserveAlternatives: boolean;

  /** Max alternatives to keep per field */
  readonly maxAlternatives: number;

  /** Additional custom signals to merge into signal dictionary */
  readonly customSignals?: Record<string, readonly string[]>;
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  confidenceThreshold: 0.3,
  includeRawData: false,
  maxTraversalDepth: 25,
  maxKeysPerSource: 50000,
  enableDomFallback: true,
  enableNetworkDiscovery: true,
  timeoutMs: 30000,
  logLevel: 'info',
  performanceMode: 'balanced',
  strictMode: false,
  debugMode: false,
  cacheEnabled: true,
  disabledExtractors: [],
  preserveAlternatives: true,
  maxAlternatives: 3,
} as const;

/**
 * Factory for creating configs with presets
 */
export class EngineConfigFactory {
  static create(overrides?: Partial<EngineConfig>): EngineConfig {
    return {
      ...DEFAULT_ENGINE_CONFIG,
      ...overrides,
      disabledExtractors: overrides?.disabledExtractors ?? DEFAULT_ENGINE_CONFIG.disabledExtractors,
    };
  }

  static fast(): EngineConfig {
    return {
      ...DEFAULT_ENGINE_CONFIG,
      maxTraversalDepth: 15,
      maxKeysPerSource: 20000,
      performanceMode: 'fast',
      timeoutMs: 15000,
    };
  }

  static thorough(): EngineConfig {
    return {
      ...DEFAULT_ENGINE_CONFIG,
      maxTraversalDepth: 30,
      maxKeysPerSource: 100000,
      performanceMode: 'thorough',
      timeoutMs: 60000,
      preserveAlternatives: true,
      maxAlternatives: 5,
    };
  }

  static debug(): EngineConfig {
    return {
      ...DEFAULT_ENGINE_CONFIG,
      logLevel: 'debug',
      debugMode: true,
      includeRawData: true,
      confidenceThreshold: 0.0,
    };
  }

  static forApify(): EngineConfig {
    return {
      ...DEFAULT_ENGINE_CONFIG,
      performanceMode: 'balanced',
      timeoutMs: 45000,
      cacheEnabled: true,
      logLevel: 'info',
    };
  }

  static strict(): EngineConfig {
    return {
      ...DEFAULT_ENGINE_CONFIG,
      strictMode: true,
      confidenceThreshold: 0.6,
    };
  }
}

/**
 * Validates engine config
 */
export function validateEngineConfig(config: EngineConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.confidenceThreshold < 0 || config.confidenceThreshold > 1) {
    errors.push('confidenceThreshold must be between 0 and 1');
  }
  if (config.maxTraversalDepth < 1 || config.maxTraversalDepth > 100) {
    errors.push('maxTraversalDepth must be between 1 and 100');
  }
  if (config.maxKeysPerSource < 100 || config.maxKeysPerSource > 1_000_000) {
    errors.push('maxKeysPerSource must be between 100 and 1_000_000');
  }
  if (config.timeoutMs < 1000 || config.timeoutMs > 300_000) {
    errors.push('timeoutMs must be between 1000 and 300000');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * ConfidenceWeights.ts
 * Defines confidence weights for different sources and extraction methods.
 * This is critical for the provenance system.
 */

export enum SourceType {
  WINDOW_OBJECT = 'WINDOW_OBJECT',
  EMBEDDED_JSON = 'EMBEDDED_JSON',
  HYDRATION_STATE = 'HYDRATION_STATE',
  NETWORK_RESPONSE = 'NETWORK_RESPONSE',
  META_TAG = 'META_TAG',
  LD_JSON = 'LD_JSON',
  DOM_FALLBACK = 'DOM_FALLBACK',
  INDEXED_DISCOVERY = 'INDEXED_DISCOVERY',
  HEURISTIC = 'HEURISTIC',
}

export interface ConfidenceWeightConfig {
  readonly baseWeight: number;
  readonly description: string;
}

/**
 * Source reliability ranking for AliExpress.
 * Window object and hydrated state are most reliable as they are directly used by frontend.
 * Network responses are also highly reliable.
 * DOM fallback is least reliable due to class name churn.
 */
export const SOURCE_CONFIDENCE_WEIGHTS: Record<SourceType, ConfidenceWeightConfig> = {
  [SourceType.WINDOW_OBJECT]: { baseWeight: 0.95, description: 'window.runParams, window._dida_config_' },
  [SourceType.HYDRATION_STATE]: { baseWeight: 0.93, description: '__NEXT_DATA__, hydration payloads' },
  [SourceType.NETWORK_RESPONSE]: { baseWeight: 0.90, description: 'XHR/Fetch intercepted JSON containing product data' },
  [SourceType.EMBEDDED_JSON]: { baseWeight: 0.85, description: 'JSON embedded in script tags' },
  [SourceType.LD_JSON]: { baseWeight: 0.80, description: 'LD+JSON structured data' },
  [SourceType.META_TAG]: { baseWeight: 0.70, description: 'meta og: tags' },
  [SourceType.INDEXED_DISCOVERY]: { baseWeight: 0.65, description: 'Result from deep indexed search' },
  [SourceType.DOM_FALLBACK]: { baseWeight: 0.40, description: 'DOM query fallback - least reliable' },
  [SourceType.HEURISTIC]: { baseWeight: 0.30, description: 'Heuristic inference' },
};

export const CONFIDENCE_ADJUSTMENTS = {
  EXACT_KEY_MATCH: 0.15,
  PATH_DEPTH_PENALTY_PER_LEVEL: -0.02,
  MULTIPLE_SOURCES_AGREE: 0.10,
  VALUE_FORMAT_VALID: 0.05,
  VALUE_FORMAT_INVALID: -0.20,
  LONG_TRAVERSAL: -0.10,
  COLLECTION_CONSISTENCY: 0.07,
} as const;

export const DEFAULT_CONFIDENCE_THRESHOLDS = {
  STRICT: 0.80,
  MODERATE: 0.50,
  LENIENT: 0.30,
  INCLUDE_ALL: 0.0,
} as const;

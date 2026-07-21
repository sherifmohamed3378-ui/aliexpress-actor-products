/**
 * Formats extraction results for Apify Dataset output.
 * Unwraps Field<T> values into flat, dataset-friendly records.
 */

import type { ExtractionResult } from '../core/ProductExtractionEngine.js';
import { isField } from '../types/common/Field.js';
import type { AliExpressProduct } from '../types/product/Product.js';

export interface ExtractionMetaBlock {
  readonly performance: ExtractionResult['performance'];
  readonly warnings: readonly string[];
  readonly fieldConfidences: Record<string, number>;
  readonly averageConfidence: number;
  readonly totalSources: number;
  readonly totalFields: number;
}

export interface ActorOutputRecord {
  readonly inputUrl: string;
  readonly extractedUrl: string;
  readonly scrapedAt: string;
  readonly success: boolean;
  readonly error?: string;
  readonly _extraction?: ExtractionMetaBlock;
  readonly _raw?: unknown;
  readonly [key: string]: unknown;
}

function flattenProduct(product: AliExpressProduct): {
  fields: Record<string, unknown>;
  fieldConfidences: Record<string, number>;
} {
  const fields: Record<string, unknown> = {};
  const fieldConfidences: Record<string, number> = {};

  for (const [key, fieldValue] of Object.entries(product)) {
    if (key === '_raw' || key === '_extractionMeta') {
      continue;
    }

    if (fieldValue === null || fieldValue === undefined) {
      fields[key] = null;
      continue;
    }

    if (isField(fieldValue)) {
      fields[key] = fieldValue.value;
      fieldConfidences[key] = fieldValue.confidence;
      continue;
    }

    fields[key] = fieldValue;
  }

  return { fields, fieldConfidences };
}

/**
 * Formats a successful extraction into a flat Apify Dataset record.
 */
export function formatActorOutput(params: {
  readonly inputUrl: string;
  readonly extractedUrl: string;
  readonly extractionResult: ExtractionResult;
}): ActorOutputRecord {
  const { extractionResult, inputUrl, extractedUrl } = params;
  const { product, performance, warnings } = extractionResult;
  const { fields, fieldConfidences } = flattenProduct(product);

  const record: ActorOutputRecord = {
    inputUrl,
    extractedUrl,
    scrapedAt: new Date().toISOString(),
    success: true,
    ...fields,
    _extraction: {
      performance,
      warnings: [...warnings],
      fieldConfidences,
      averageConfidence: product._extractionMeta?.averageConfidence ?? performance.averageConfidence,
      totalSources: product._extractionMeta?.totalSources ?? performance.sources,
      totalFields: product._extractionMeta?.totalFields ?? performance.fields,
    },
  };

  if (product._raw !== undefined) {
    return { ...record, _raw: product._raw };
  }

  return record;
}

/**
 * Formats a failed request/extraction into a dataset record.
 */
export function formatActorErrorOutput(params: {
  readonly inputUrl: string;
  readonly extractedUrl?: string;
  readonly error: string;
}): ActorOutputRecord {
  return {
    inputUrl: params.inputUrl,
    extractedUrl: params.extractedUrl ?? params.inputUrl,
    scrapedAt: new Date().toISOString(),
    success: false,
    error: params.error,
  };
}

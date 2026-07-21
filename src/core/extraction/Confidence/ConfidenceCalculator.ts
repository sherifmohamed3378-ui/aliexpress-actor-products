/**
 * ConfidenceCalculator.ts
 * Calculates confidence scores based on source type, path depth, value validity, etc.
 */

import { SOURCE_CONFIDENCE_WEIGHTS, CONFIDENCE_ADJUSTMENTS, type SourceType } from '../../../constants/ConfidenceWeights.js';
import { clampConfidence } from '../../../types/common/Confidence.js';
import { logger } from '../../../utils/Logger.js';

import type { FoundEntry } from '../../../types/discovery/DiscoveryTypes.js';

export interface ConfidenceInput {
  readonly sourceType: SourceType;
  readonly path: string;
  readonly key: string;
  readonly matchedSignal: string;
  readonly value: unknown;
  readonly depth: number;
  readonly hasAlternatives: boolean;
  readonly validationPassed: boolean;
}

export class ConfidenceCalculator {
  private readonly log = logger.child('ConfidenceCalculator');

  calculate(input: ConfidenceInput): { final: number; breakdown: { reason: string; delta: number }[] } {
    const baseConfig = SOURCE_CONFIDENCE_WEIGHTS[input.sourceType];
    const base = baseConfig?.baseWeight ?? 0.5;

    const adjustments: { reason: string; delta: number }[] = [];

    // Exact key match bonus
    if (input.key.toLowerCase() === input.matchedSignal.toLowerCase()) {
      adjustments.push({ reason: 'EXACT_KEY_MATCH', delta: CONFIDENCE_ADJUSTMENTS.EXACT_KEY_MATCH });
    }

    // Path depth penalty
    if (input.depth > 5) {
      const penalty = (input.depth - 5) * CONFIDENCE_ADJUSTMENTS.PATH_DEPTH_PENALTY_PER_LEVEL;
      adjustments.push({ reason: `DEPTH_PENALTY_${input.depth}`, delta: penalty });
    }

    // Validation bonus/penalty
    if (input.validationPassed) {
      adjustments.push({ reason: 'VALUE_FORMAT_VALID', delta: CONFIDENCE_ADJUSTMENTS.VALUE_FORMAT_VALID });
    } else {
      adjustments.push({ reason: 'VALUE_FORMAT_INVALID', delta: CONFIDENCE_ADJUSTMENTS.VALUE_FORMAT_INVALID });
    }

    // Long traversal penalty (if path very long)
    if (input.path.length > 150) {
      adjustments.push({ reason: 'LONG_TRAVERSAL', delta: CONFIDENCE_ADJUSTMENTS.LONG_TRAVERSAL });
    }

    // Alternatives considered? If multiple sources agree, boost would be applied at merging stage
    // For now, no extra

    const finalRaw = base + adjustments.reduce((acc, cur) => acc + cur.delta, 0);
    const final = clampConfidence(finalRaw);

    this.log.debug(`Confidence calc`, {
      source: input.sourceType,
      base,
      adjustments,
      final,
      path: input.path.slice(0, 100),
    });

    return { final, breakdown: adjustments };
  }

  calculateForEntry(entry: FoundEntry, matchedSignal: string, validationPassed: boolean): number {
    const input: ConfidenceInput = {
      sourceType: entry.source.type,
      path: entry.path,
      key: entry.key,
      matchedSignal,
      value: entry.value,
      depth: entry.depth,
      hasAlternatives: false,
      validationPassed,
    };

    return this.calculate(input).final;
  }

  mergeConfidences(confidences: readonly number[]): number {
    if (confidences.length === 0) return 0;
    if (confidences.length === 1) return confidences[0] ?? 0;

    // If multiple sources agree, boost confidence
    const max = Math.max(...confidences);
    const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const boost = confidences.length > 1 ? CONFIDENCE_ADJUSTMENTS.MULTIPLE_SOURCES_AGREE : 0;

    return clampConfidence(max * 0.7 + avg * 0.3 + boost);
  }
}
